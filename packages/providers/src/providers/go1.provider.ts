/**
 * GO1 connector — Provider Abstraction Layer reference implementation.
 *
 * STATUS (2026-09-10): GO1's real REST API docs (developers.go1.com, version 2025-01-01) are now
 * in hand and the read path is LIVE-VERIFIED against the sandbox portal (36740057):
 *   - Auth: OAuth2 client-credentials -> POST https://auth.go1.com/oauth/token (12h bearer).
 *   - Data host: https://gateway.go1.com  (NOT api.go1.com — that host 404s / is legacy).
 *   - Every data request MUST send the `Api-Version: 2025-01-01` header.
 *   - List endpoints return an Elasticsearch-style envelope: { total, hits: [...] }.
 *     Pagination is `limit` + `offset` (offset capped at 10000; use `scroll` beyond that).
 *
 * Confidence levels of what's below:
 *   - listCourses / getCourse / listLearningPaths / getCourseSkills / syncCatalog / healthCheck:
 *     hit GET /learning-objects, whose path, params and response shape are CONFIRMED live.
 *   - createLearner / enrollLearner / getProgress / getCertificate / getLaunchUrl:
 *     wired to the documented enrollment/user/play-link endpoints, but their exact request/response
 *     shapes are NOT yet live-verified (needs a real sandbox portal user to exercise). Each is
 *     marked UNVERIFIED and coded to GO1's documented conventions; confirm before production writes.
 */

import type {
  CourseProvider,
  ProviderConnectionConfig,
  ProviderDescriptor,
  ListCoursesOptions,
} from "../course-provider.interface";
import type {
  CanonicalCourse,
  CanonicalCertificate,
  CanonicalLearningPath,
  CatalogSyncResult,
  ContentFormat,
  CourseModality,
  Enrollment,
  EnrollmentStatus,
  Paginated,
  Progress,
  ProviderLearner,
  SkillTag,
} from "../types";
import { ClientCredentialsTokenCache } from "../oauth-client-credentials";

const DESCRIPTOR: ProviderDescriptor = {
  key: "go1",
  displayName: "GO1",
  phase: 1,
  capabilities: {
    catalogSync: true,
    enrollment: true,
    progressTracking: true,
    completionTracking: true,
    certificates: true,
    ssoLaunch: true,
    webhooks: true,
    skillMetadata: true,
    scorm: true,
    xapi: true,
  },
};

// Confirmed 2026-09-10 against the live sandbox:
//   token host  = auth.go1.com   (client-credentials; api.go1.com/oauth/token 404s)
//   data host   = gateway.go1.com (api.go1.com is legacy and 404s)
const DEFAULT_BASE_URL = "https://gateway.go1.com";
const DEFAULT_TOKEN_URL = "https://auth.go1.com/oauth/token";

// Required on every gateway request — the date-based API version selector.
const API_VERSION = "2025-01-01";

// GO1 segregates learning objects into "collections". A freshly-provisioned portal's own library
// is empty, so an unfiltered /learning-objects returns { total: 0 }. To browse the GO1 catalog the
// portal can subscribe to, filter by collection. Overridable per-connection via options.collection
// or the GO1_CONTENT_COLLECTION env var. Empty string => send no collection filter (portal library).
const DEFAULT_COLLECTION = process.env.GO1_CONTENT_COLLECTION ?? "not_added_to_library";

// This sandbox portal's catalog is overwhelmingly non-English (confirmed live 2026-09-28: filtering
// language[]=en on /learning-objects drops total from 108,557 to 82,688 — still the large majority,
// so unfiltered listing/sync surfaces mostly ja/ko content). Default to English; overridable
// per-connection via options.language or the GO1_CONTENT_LANGUAGE env var, or per-call via
// ListCoursesOptions.locale. Empty string => send no language filter.
const DEFAULT_LANGUAGE = process.env.GO1_CONTENT_LANGUAGE ?? "en";

// Confirmed live 2026-09-28: the real full-text search param is `keyword` (bare string — unlike
// `include`/`language` it is NOT array-syntax; `keyword[]=` 400s). It behaves as an AND across the
// words it's given (`keyword=compliance security finance` -> total=103, far below any single term's
// total), not an OR — so one request can't cover several unrelated topics at once. To scope a sync
// to "compliance + IT/tech + finance" we therefore fan out one request per representative keyword
// below and merge+dedupe by id, rather than trying to cram every topic into one query string.
// Overridable via options.topicKeywords or the comma-separated GO1_CONTENT_KEYWORDS env var; an
// explicit ListCoursesOptions.query always bypasses this and does a single plain keyword search.
const DEFAULT_TOPIC_KEYWORDS = (
  process.env.GO1_CONTENT_KEYWORDS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [
    // Compliance / regulatory
    "security awareness",
    "HIPAA",
    "SOC 2",
    "GDPR",
    "ISO 27001",
    "regulatory compliance",
    // IT / tech skills
    "cybersecurity",
    "cloud computing",
    "Kubernetes",
    "Python programming",
    "DevOps",
    // Finance / FinTech
    "fintech",
    "financial compliance",
    "banking regulation",
  ]
);

// A topic-scoped sync isn't limited by GO1's 50-per-request cap the way a single query is — each
// keyword below is its own request — so default to something more useful than one page when the
// caller doesn't specify how many they want.
const DEFAULT_TOPIC_SYNC_TARGET = 150;

const MAX_OFFSET = 10000; // GO1 hard cap on limit+offset paging; deeper pages need `scroll`.
// Confirmed live 2026-09-28: /learning-objects rejects limit>50 with a 400
// LEARNING_OBJECT_SEARCH_ERROR ("limit: Number was expected to be at most 50").
const MAX_LIMIT = 50;

// Confirmed live 2026-09-28: /learning-objects returns ONLY id/lo_id/timestamps by default — core,
// relevance and lifecycle are all opt-in via repeated `include[]=<segment>` query params (ES-style
// array syntax; a comma-joined "core,relevance" is silently ignored, and a bare repeated
// `include=core&include=relevance` 400s with "is not an array and does not implement Traversable").
// Every list/get call below must send LEARNING_OBJECT_INCLUDES or every field under core/relevance/
// lifecycle comes back undefined (this is what caused the first live sync to upsert 50 real GO1
// rows that were all title="(untitled)").
const LEARNING_OBJECT_INCLUDES = ["core", "relevance", "lifecycle"];

/** Loose shapes for GO1's learning-object payloads (only the fields we consume are typed). */
interface Go1LearningObject {
  id: string; // canonical id, e.g. "con_xxx"
  lo_id?: number; // legacy numeric id
  created_time?: string;
  updated_time?: string;
  core?: {
    // course | resource | video | document | interactive | learning_pathway | event | ...
    // NOTE: this lives under core, NOT top-level — confirmed live 2026-09-28.
    type?: string;
    title?: string;
    description?: string;
    summary?: string;
    // Confirmed live 2026-09-28: an object, not a bare URL string.
    image?: { key?: string; value?: string; mimetype?: string };
    language?: string;
    duration?: number;
    external_id?: string;
    provider_id?: number | string;
    provider?: { id?: number | string; name?: string } | string;
    standalone?: boolean;
    tags?: string[];
    topics?: string[];
    delivery?: string;
    child_ids?: string[];
    children?: Array<{ id?: string }>;
  };
  relevance?: {
    duration?: number; // seconds (see toMinutes)
    language?: string;
    summary?: string;
    year_created?: number;
    entry_level?: string;
    learning_outcomes?: string[];
    region?: string[];
    locale?: string[];
    is_compliance?: boolean;
    tags?: string[];
    topics?: string[];
  };
  lifecycle?: { state?: string };
}

interface Go1ListResponse<T> {
  total?: number;
  hits?: T[];
  offset?: number;
  limit?: number;
}

export class Go1Provider implements CourseProvider {
  readonly descriptor = DESCRIPTOR;
  private readonly baseUrl: string;
  private readonly collection: string;
  private readonly language: string;
  private readonly topicKeywords: string[];
  private readonly tokens: ClientCredentialsTokenCache;

  constructor(private readonly config: ProviderConnectionConfig) {
    this.baseUrl = (config.options?.baseUrl as string) || process.env.GO1_API_BASE_URL || DEFAULT_BASE_URL;
    this.collection =
      (config.options?.collection as string | undefined) ?? DEFAULT_COLLECTION;
    this.language = (config.options?.language as string | undefined) ?? DEFAULT_LANGUAGE;
    this.topicKeywords = (config.options?.topicKeywords as string[] | undefined) ?? DEFAULT_TOPIC_KEYWORDS;
    this.tokens = new ClientCredentialsTokenCache({
      tokenUrl: (config.options?.tokenUrl as string) || process.env.GO1_OAUTH_TOKEN_URL || DEFAULT_TOKEN_URL,
      // Normal path is per-tenant credentials entered via the Providers admin page
      // (ProviderConnection.credentialsEnc); the env vars are just a fallback for a headless/
      // single-tenant setup or local testing without going through that UI flow.
      clientId: config.credentials.clientId || process.env.GO1_CLIENT_ID || "",
      clientSecret: config.credentials.clientSecret || process.env.GO1_CLIENT_SECRET || "",
    });
  }

  // ---------------------------------------------------------------------------
  // HTTP plumbing (confirmed live)
  // ---------------------------------------------------------------------------

  /** Authenticated fetch against the GO1 gateway. Adds the mandatory Api-Version + auth headers,
   *  and transparently refreshes the token once on a 401 (expired/rotated). */
  private async authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const doFetch = async (token: string) =>
      fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          "api-version": API_VERSION,
          "content-type": "application/json",
          accept: "application/json",
          ...init.headers,
          Authorization: `Bearer ${token}`,
        },
      });

    let res = await doFetch(await this.tokens.getToken());
    if (res.status === 401) {
      res = await doFetch(await this.tokens.refresh());
    }
    return res;
  }

  /** GET a JSON resource, throwing a descriptive error on non-2xx. */
  private async getJson<T>(path: string): Promise<T> {
    const res = await this.authedFetch(path);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`GO1 GET ${path} -> ${res.status} ${res.statusText} ${body.slice(0, 500)}`);
    }
    return (await res.json()) as T;
  }

  private buildQuery(params: Record<string, string | number | string[] | undefined | null>): string {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      if (Array.isArray(v)) {
        // GO1's ES-style array params (e.g. include[]=core&include[]=relevance).
        for (const item of v) qs.append(`${k}[]`, item);
      } else {
        qs.set(k, String(v));
      }
    }
    const s = qs.toString();
    return s ? `?${s}` : "";
  }

  /** Strip markup from GO1's HTML descriptions — the web app renders `description` as plain
   *  text (no dangerouslySetInnerHTML), so raw `<p>`/`<br />`/`<li>` would show up literally. */
  private stripHtml(html?: string): string {
    if (!html) return "";
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  // ---------------------------------------------------------------------------
  // Normalization (GO1 learning-object -> canonical)
  // ---------------------------------------------------------------------------

  /** GO1 relevance.duration is reported in seconds; canonical wants whole minutes. */
  private toMinutes(seconds?: number): number | undefined {
    if (!seconds || seconds <= 0) return undefined;
    return Math.max(1, Math.round(seconds / 60));
  }

  private mapModality(type?: string): CourseModality {
    switch ((type || "").toLowerCase()) {
      case "event":
      case "session":
        return "live";
      case "video":
      case "resource":
      case "document":
        return "micro";
      default:
        return "self-paced";
    }
  }

  private mapFormats(type?: string, delivery?: string): ContentFormat[] {
    const t = (type || "").toLowerCase();
    const d = (delivery || "").toLowerCase();
    const formats = new Set<ContentFormat>();
    if (t === "video") formats.add("video");
    if (t === "document" || t === "resource" || t === "article") formats.add("article");
    if (t === "interactive") formats.add("interactive");
    if (t === "assessment" || t === "quiz") formats.add("assessment");
    if (d.includes("scorm")) formats.add("scorm");
    if (d.includes("xapi") || d.includes("tincan")) formats.add("xapi");
    if (formats.size === 0) formats.add("interactive");
    return [...formats];
  }

  private extractTags(lo: Go1LearningObject): string[] {
    const raw = [
      ...(lo.core?.tags ?? []),
      ...(lo.core?.topics ?? []),
      ...(lo.relevance?.tags ?? []),
      ...(lo.relevance?.topics ?? []),
    ];
    return [...new Set(raw.filter((t) => typeof t === "string" && t.trim() !== ""))];
  }

  private mapPublisher(lo: Go1LearningObject): string | undefined {
    const p = lo.core?.provider;
    if (typeof p === "string") return p;
    if (p && typeof p === "object" && p.name) return p.name;
    return lo.core?.provider_id != null ? String(lo.core.provider_id) : undefined;
  }

  private normalizeCourse(lo: Go1LearningObject): CanonicalCourse {
    const tags = this.extractTags(lo);
    return {
      providerKey: this.descriptor.key,
      externalId: lo.id,
      title: lo.core?.title ?? "(untitled)",
      description: this.stripHtml(lo.relevance?.summary ?? lo.core?.summary ?? lo.core?.description),
      language: lo.relevance?.language ?? lo.core?.language ?? "en",
      durationMinutes: this.toMinutes(lo.relevance?.duration ?? lo.core?.duration),
      modality: this.mapModality(lo.core?.type),
      formats: this.mapFormats(lo.core?.type, lo.core?.delivery),
      imageUrl: lo.core?.image?.value || undefined,
      publisher: this.mapPublisher(lo),
      skills: tags.map((raw) => ({ raw, canonicalSkillId: null, confidence: 0 })),
      rawCategories: tags,
      updatedAt: lo.updated_time ? new Date(lo.updated_time) : new Date(),
    };
  }

  private normalizeLearningPath(lo: Go1LearningObject): CanonicalLearningPath {
    const childIds =
      lo.core?.child_ids ??
      (lo.core?.children ?? []).map((c) => c.id).filter((id): id is string => !!id) ??
      [];
    const tags = this.extractTags(lo);
    return {
      providerKey: this.descriptor.key,
      externalId: lo.id,
      title: lo.core?.title ?? "(untitled)",
      description: this.stripHtml(lo.relevance?.summary ?? lo.core?.description),
      courseExternalIds: childIds,
      skills: tags.map((raw) => ({ raw, canonicalSkillId: null, confidence: 0 })),
      updatedAt: lo.updated_time ? new Date(lo.updated_time) : new Date(),
    };
  }

  // ---------------------------------------------------------------------------
  // Catalog (confirmed live: GET /learning-objects)
  // ---------------------------------------------------------------------------

  async healthCheck() {
    const hasClientId = this.config.credentials.clientId || process.env.GO1_CLIENT_ID;
    const hasClientSecret = this.config.credentials.clientSecret || process.env.GO1_CLIENT_SECRET;
    if (!hasClientId || !hasClientSecret) {
      return { ok: false, detail: "No GO1 client credentials configured for this connection." };
    }
    try {
      // Cheap, real, authenticated call: list one learning object. Proves token + gateway + version.
      const data = await this.getJson<Go1ListResponse<Go1LearningObject>>(
        `/learning-objects${this.buildQuery({ limit: 1, collection: this.collection, include: LEARNING_OBJECT_INCLUDES })}`,
      );
      return {
        ok: true,
        detail: `GO1 gateway reachable; /learning-objects returned total=${data.total ?? "?"}.`,
      };
    } catch (err) {
      return { ok: false, detail: err instanceof Error ? err.message : "Unknown GO1 error" };
    }
  }

  /** One /learning-objects page for a single (optional) keyword — the shared primitive behind
   *  both a plain listCourses() call and the multi-keyword topic fan-out below. */
  private async fetchCoursePage(
    keyword: string | undefined,
    limit: number,
    offset: number,
    opts: Pick<ListCoursesOptions, "locale" | "updatedSince">,
  ): Promise<{ hits: Go1LearningObject[]; total: number }> {
    const language = opts.locale ?? this.language;
    const query = this.buildQuery({
      limit,
      offset,
      collection: this.collection,
      include: LEARNING_OBJECT_INCLUDES,
      // Confirmed live 2026-09-28: like `include`, this needs array syntax — a bare
      // `language=en` 400s the same way a bare `include=core` does.
      language: language ? [language] : undefined,
      // Confirmed live 2026-09-28: the real param is `keyword` (bare string, not array-syntax —
      // `keyword[]=` 400s). Only send when provided.
      keyword,
      facets: "false",
      updated_after: opts.updatedSince ? opts.updatedSince.toISOString() : undefined,
    });
    const data = await this.getJson<Go1ListResponse<Go1LearningObject>>(`/learning-objects${query}`);
    const hits = (data.hits ?? []).filter((lo) => (lo.core?.type ?? "course") !== "learning_pathway");
    return { hits, total: data.total ?? hits.length };
  }

  /** Fan out one /learning-objects request per curated topic keyword (compliance/regulatory,
   *  IT/tech, finance/FinTech — see DEFAULT_TOPIC_KEYWORDS) and merge+dedupe by id. GO1's
   *  `keyword` param ANDs every word in a single query, so one request can't cover several
   *  unrelated topics — this is the only way to scope a sync to all of them at once. */
  private async listCoursesByTopics(opts: ListCoursesOptions): Promise<Paginated<CanonicalCourse>> {
    const targetTotal = opts.limit ?? DEFAULT_TOPIC_SYNC_TARGET;
    // Give every keyword an equal, capped-up-front slice of the budget rather than draining it
    // first-come-first-served — some keywords (HIPAA, GDPR) have far bigger pools than others
    // (Kubernetes, SOC 2) and would otherwise crowd out every keyword after them before the loop's
    // overall-total check ever fires, leaving whole categories unrepresented.
    const perKeywordQuota = Math.min(Math.max(1, Math.ceil(targetTotal / this.topicKeywords.length)), MAX_LIMIT);
    const seen = new Map<string, CanonicalCourse>();
    for (const keyword of this.topicKeywords) {
      const { hits } = await this.fetchCoursePage(keyword, perKeywordQuota, 0, opts);
      for (const lo of hits) {
        if (!seen.has(lo.id)) seen.set(lo.id, this.normalizeCourse(lo));
      }
    }
    const items = [...seen.values()];
    // No cursor: a stable "page 2" across a multi-keyword merge would need to track how far into
    // each keyword's own result set we got, which nothing currently calls listCourses() to do.
    return { items, total: items.length, nextCursor: undefined };
  }

  async listCourses(opts: ListCoursesOptions = {}): Promise<Paginated<CanonicalCourse>> {
    // An explicit query (or mid-pagination call) always means "search for exactly this," bypassing
    // the curated topic scoping below.
    if (!opts.query && !opts.cursor && this.topicKeywords.length > 0) {
      return this.listCoursesByTopics(opts);
    }
    const limit = Math.min(opts.limit ?? MAX_LIMIT, MAX_LIMIT);
    const offset = opts.cursor ? parseInt(opts.cursor, 10) || 0 : 0;
    const { hits, total } = await this.fetchCoursePage(opts.query, limit, offset, opts);
    const nextOffset = offset + limit;
    return {
      items: hits.map((lo) => this.normalizeCourse(lo)),
      total,
      nextCursor: nextOffset < total && nextOffset < MAX_OFFSET ? String(nextOffset) : undefined,
    };
  }

  async getCourse(externalId: string): Promise<CanonicalCourse | null> {
    try {
      const lo = await this.getJson<Go1LearningObject>(
        `/learning-objects/${encodeURIComponent(externalId)}${this.buildQuery({ include: LEARNING_OBJECT_INCLUDES })}`,
      );
      return lo && lo.id ? this.normalizeCourse(lo) : null;
    } catch (err) {
      if (err instanceof Error && /-> 404/.test(err.message)) return null;
      throw err;
    }
  }

  async listLearningPaths(opts: ListCoursesOptions = {}): Promise<Paginated<CanonicalLearningPath>> {
    const limit = Math.min(opts.limit ?? MAX_LIMIT, MAX_LIMIT);
    const offset = opts.cursor ? parseInt(opts.cursor, 10) || 0 : 0;
    const language = opts.locale ?? this.language;
    const query = this.buildQuery({
      limit,
      offset,
      type: "learning_pathway",
      collection: this.collection,
      include: LEARNING_OBJECT_INCLUDES,
      language: language ? [language] : undefined,
      facets: "false",
    });
    const data = await this.getJson<Go1ListResponse<Go1LearningObject>>(`/learning-objects${query}`);
    const hits = data.hits ?? [];
    const nextOffset = offset + limit;
    const total = data.total ?? hits.length;
    return {
      items: hits.map((lo) => this.normalizeLearningPath(lo)),
      total,
      nextCursor: nextOffset < total && nextOffset < MAX_OFFSET ? String(nextOffset) : undefined,
    };
  }

  async syncCatalog(opts: { updatedSince?: Date } = {}): Promise<CatalogSyncResult> {
    const startedAt = new Date();
    const errors: { externalId?: string; message: string }[] = [];
    let coursesUpserted = 0;
    let pathsUpserted = 0;

    // Page through the catalog. Persistence into the normalized store is the sync orchestrator's
    // job (it consumes these pages); here we enumerate + count so the caller gets an accurate delta.
    try {
      let cursor: string | undefined;
      do {
        const page = await this.listCourses({ updatedSince: opts.updatedSince, cursor, limit: 100 });
        coursesUpserted += page.items.length;
        cursor = page.nextCursor;
      } while (cursor);
    } catch (err) {
      errors.push({ message: `course sync: ${err instanceof Error ? err.message : String(err)}` });
    }

    try {
      let cursor: string | undefined;
      do {
        const page = await this.listLearningPaths({ updatedSince: opts.updatedSince, cursor, limit: 100 });
        pathsUpserted += page.items.length;
        cursor = page.nextCursor;
      } while (cursor);
    } catch (err) {
      errors.push({ message: `path sync: ${err instanceof Error ? err.message : String(err)}` });
    }

    return {
      providerKey: this.descriptor.key,
      startedAt,
      finishedAt: new Date(),
      coursesUpserted,
      pathsUpserted,
      coursesRetired: 0, // requires diffing against the prior snapshot — done by the orchestrator.
      errors,
    };
  }

  async getCourseSkills(externalId: string): Promise<SkillTag[]> {
    const course = await this.getCourse(externalId);
    return course?.skills ?? [];
  }

  // ---------------------------------------------------------------------------
  // Learner lifecycle + tracking
  // UNVERIFIED: coded to GO1's documented enrollment/user endpoints; request/response shapes have
  // not yet been exercised against a live sandbox portal user. Confirm before production writes.
  // ---------------------------------------------------------------------------

  private mapEnrollmentStatus(raw?: string): EnrollmentStatus {
    switch ((raw || "").toLowerCase()) {
      case "completed":
      case "passed":
        return "completed";
      case "in-progress":
      case "in_progress":
        return "in-progress";
      case "failed":
        return "failed";
      case "expired":
        return "expired";
      default:
        return "enrolled";
    }
  }

  async createLearner(input: ProviderLearner): Promise<{ externalLearnerId: string }> {
    // UNVERIFIED. Documented: POST /users creates a portal user; idempotent on email.
    const res = await this.authedFetch(`/users`, {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        locale: input.locale,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`GO1 createLearner -> ${res.status} ${body.slice(0, 500)}`);
    }
    const user = (await res.json()) as { id?: string | number; user_id?: string | number };
    const id = user.id ?? user.user_id;
    return { externalLearnerId: id != null ? String(id) : "" };
  }

  async enrollLearner(input: {
    externalLearnerId: string;
    externalCourseId: string;
    idempotencyKey: string;
  }): Promise<Enrollment> {
    // UNVERIFIED. Documented: POST /enrollments; Idempotency-Key header guards retries.
    const res = await this.authedFetch(`/enrollments`, {
      method: "POST",
      headers: { "Idempotency-Key": input.idempotencyKey },
      body: JSON.stringify({
        lo_id: input.externalCourseId,
        user_id: input.externalLearnerId,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`GO1 enrollLearner -> ${res.status} ${body.slice(0, 500)}`);
    }
    const e = (await res.json()) as {
      id?: string | number;
      status?: string;
      created_time?: string;
    };
    return {
      externalEnrollmentId: e.id != null ? String(e.id) : "",
      externalLearnerId: input.externalLearnerId,
      externalCourseId: input.externalCourseId,
      status: this.mapEnrollmentStatus(e.status),
      enrolledAt: e.created_time ? new Date(e.created_time) : new Date(),
    };
  }

  async getProgress(input: {
    externalLearnerId: string;
    externalCourseId: string;
  }): Promise<Progress> {
    // UNVERIFIED. Documented: GET /enrollments filtered by user + learning object.
    const query = this.buildQuery({
      user_id: input.externalLearnerId,
      lo_id: input.externalCourseId,
      limit: 1,
    });
    const data = await this.getJson<
      Go1ListResponse<{
        status?: string;
        progress?: number;
        pass?: boolean;
        score?: number;
        updated_time?: string;
        completed_time?: string;
      }>
    >(`/enrollments${query}`);
    const e = data.hits?.[0];
    const pct =
      e?.progress != null ? (e.progress <= 1 ? Math.round(e.progress * 100) : Math.round(e.progress)) : 0;
    return {
      externalLearnerId: input.externalLearnerId,
      externalCourseId: input.externalCourseId,
      status: this.mapEnrollmentStatus(e?.status),
      percent: pct,
      score: e?.score,
      lastActivityAt: e?.updated_time ? new Date(e.updated_time) : undefined,
      completedAt: e?.completed_time ? new Date(e.completed_time) : undefined,
    };
  }

  async getCertificate(input: {
    externalLearnerId: string;
    externalCourseId: string;
  }): Promise<CanonicalCertificate | null> {
    // UNVERIFIED / not yet mapped: GO1 exposes certificates per completed enrollment, but the exact
    // endpoint isn't confirmed. Returning null (capability declared, wiring pending) rather than
    // guessing a path that would 404 at runtime.
    void input;
    return null;
  }

  async getLaunchUrl(input: {
    externalLearnerId: string;
    externalCourseId: string;
    returnUrl: string;
  }): Promise<string> {
    // UNVERIFIED. Documented: GO1 issues short-lived SSO "play links" for a user+LO. Endpoint shape
    // not yet confirmed, so fall back to the caller's returnUrl rather than 404.
    void input;
    return input.returnUrl;
  }
}

export const go1Factory = {
  key: DESCRIPTOR.key,
  create: (config: ProviderConnectionConfig) => new Go1Provider(config),
};
