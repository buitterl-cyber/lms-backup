/**
 * GO1 connector (Phase 1) — reference implementation of the Provider Abstraction Layer.
 *
 * This is a production-shaped skeleton: the contract, normalization, pagination, idempotency,
 * and capability declaration are real; the HTTP calls are marked TODO so the MVP build plan
 * (docs/05) can wire the GO1 OAuth2 client + endpoints. Use this file as the template for
 * every other connector — copy, rename, fill the TODOs.
 *
 * STATUS (2026-08-03): we do not yet have GO1's API documentation, sandbox credentials, or
 * confirmed schema — still waiting on Luke Barnes at GO1. Everything below that references a
 * concrete GO1 URL, param name, or payload shape is a best-guess placeholder based on common
 * content-aggregator/OAuth2 conventions (and GO1's own public marketing docs where available),
 * NOT a confirmed implementation. `capabilities.webhooks: true` is also a guess — GO1 may push
 * completions via webhook, require polling, or both; do not build downstream logic that assumes
 * one over the other until confirmed (see jobs/provider-progress-poll.job.ts and
 * providers/provider-webhooks.controller.ts, both gated/generic for this exact reason).
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
  Enrollment,
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

// Confirmed 2026-09-03 by a live client_credentials handshake against the sandbox: the OAuth
// token endpoint lives on auth.go1.com (api.go1.com/oauth/token 404s). api.go1.com is still the
// resource API host, but its real paths are UNCONFIRMED — the /v3/* guesses at each call site
// below currently 404 ("No route found"), pending GO1's actual API docs.
const DEFAULT_BASE_URL = "https://api.go1.com";
const DEFAULT_TOKEN_URL = "https://auth.go1.com/oauth/token";

export class Go1Provider implements CourseProvider {
  readonly descriptor = DESCRIPTOR;
  private readonly baseUrl: string;
  private readonly tokens: ClientCredentialsTokenCache;

  constructor(private readonly config: ProviderConnectionConfig) {
    this.baseUrl = (config.options?.baseUrl as string) || process.env.GO1_API_BASE_URL || DEFAULT_BASE_URL;
    this.tokens = new ClientCredentialsTokenCache({
      tokenUrl: (config.options?.tokenUrl as string) || process.env.GO1_OAUTH_TOKEN_URL || DEFAULT_TOKEN_URL,
      // Normal path is per-tenant credentials entered via the Providers admin page
      // (ProviderConnection.credentialsEnc); the env vars are just a fallback for a headless/
      // single-tenant setup or local testing without going through that UI flow.
      clientId: config.credentials.clientId || process.env.GO1_CLIENT_ID || "",
      clientSecret: config.credentials.clientSecret || process.env.GO1_CLIENT_SECRET || "",
    });
  }

  /** Authenticated fetch against the GO1 API — auth plumbing is real, the paths/shapes below
   *  each call site are TODO pending real docs. */
  private async authedFetch(path: string, init?: RequestInit): Promise<Response> {
    const token = await this.tokens.getToken();
    return fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { ...init?.headers, Authorization: `Bearer ${token}` },
    });
  }

  async healthCheck() {
    const hasClientId = this.config.credentials.clientId || process.env.GO1_CLIENT_ID;
    const hasClientSecret = this.config.credentials.clientSecret || process.env.GO1_CLIENT_SECRET;
    if (!hasClientId || !hasClientSecret) {
      return { ok: false, detail: "No GO1 client credentials configured for this connection." };
    }
    try {
      // TODO(GO1 docs): swap for a cheap, confirmed-real authenticated endpoint (e.g. a
      // "whoami"/account-info call or `/learning-objects?limit=1`) once we have real docs.
      await this.tokens.getToken();
      return { ok: true, detail: "Token acquired (endpoint calls still stubbed — see TODOs)." };
    } catch (err) {
      return { ok: false, detail: err instanceof Error ? err.message : "Unknown auth error" };
    }
  }

  async listCourses(opts: ListCoursesOptions = {}): Promise<Paginated<CanonicalCourse>> {
    // TODO: GET https://api.go1.com/v3/learning-objects?type=course&updated_after=...
    // Map each GO1 learning-object -> normalizeCourse().
    void opts;
    return { items: [], total: 0 };
  }

  async getCourse(externalId: string): Promise<CanonicalCourse | null> {
    // TODO: GET /v3/learning-objects/{id}
    void externalId;
    return null;
  }

  async listLearningPaths(opts: ListCoursesOptions = {}): Promise<Paginated<CanonicalLearningPath>> {
    // TODO: GET /v3/learning-objects?type=learning_pathway
    void opts;
    return { items: [] };
  }

  async syncCatalog(opts: { updatedSince?: Date } = {}): Promise<CatalogSyncResult> {
    const startedAt = new Date();
    // TODO: page through listCourses({ updatedSince }) + listLearningPaths, upsert into the
    // normalized catalog store, mark missing-as-retired. Honor incremental `updatedSince`.
    void opts;
    return {
      providerKey: this.descriptor.key,
      startedAt,
      finishedAt: startedAt,
      coursesUpserted: 0,
      pathsUpserted: 0,
      coursesRetired: 0,
      errors: [],
    };
  }

  async getCourseSkills(externalId: string): Promise<SkillTag[]> {
    // GO1 exposes tags/topics — map raw -> SkillTag and let the Skills reconciler resolve.
    void externalId;
    return [];
  }

  async createLearner(input: ProviderLearner): Promise<{ externalLearnerId: string }> {
    // TODO: POST /v3/users (GO1 portal user). Idempotent on email.
    void input;
    return { externalLearnerId: "stub" };
  }

  async enrollLearner(input: {
    externalLearnerId: string;
    externalCourseId: string;
    idempotencyKey: string;
  }): Promise<Enrollment> {
    // TODO: POST /enrollment with Idempotency-Key header.
    return {
      externalEnrollmentId: "stub",
      externalLearnerId: input.externalLearnerId,
      externalCourseId: input.externalCourseId,
      status: "enrolled",
      enrolledAt: new Date(),
    };
  }

  async getProgress(input: {
    externalLearnerId: string;
    externalCourseId: string;
  }): Promise<Progress> {
    // TODO: GET /enrollment?userId=&loId=
    return {
      externalLearnerId: input.externalLearnerId,
      externalCourseId: input.externalCourseId,
      status: "in-progress",
      percent: 0,
    };
  }

  async getCertificate(input: {
    externalLearnerId: string;
    externalCourseId: string;
  }): Promise<CanonicalCertificate | null> {
    // TODO: GET certificate for completed enrollment; map issuedAt/expiresAt/cpdHours.
    void input;
    return null;
  }

  async getLaunchUrl(input: {
    externalLearnerId: string;
    externalCourseId: string;
    returnUrl: string;
  }): Promise<string> {
    // TODO: GO1 SSO deep-link.
    return input.returnUrl;
  }
}

export const go1Factory = {
  key: DESCRIPTOR.key,
  create: (config: ProviderConnectionConfig) => new Go1Provider(config),
};
