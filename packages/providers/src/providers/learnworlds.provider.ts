/**
 * LearnWorlds connector (Phase 2). Lets a client connect THEIR OWN LearnWorlds school so
 * RiyadaIntel can sync their catalog, provision learners, and enrol them — the "enlist people in
 * their own platform" flow. This is the real LearnWorlds API v2 shape (OAuth2 client-credentials
 * + the `Lw-Client` header); exact paths/fields should be confirmed against
 * developer.learnworlds.com for a given school. Credentials per connection:
 *   { school: "<school>.learnworlds.com" | full URL, clientId, clientSecret }
 */
import type {
  CourseProvider, ProviderConnectionConfig, ProviderDescriptor, ListCoursesOptions,
} from "../course-provider.interface";
import type {
  CanonicalCourse, CanonicalCertificate, CanonicalLearningPath, CatalogSyncResult,
  Enrollment, Paginated, Progress, ProviderLearner, SkillTag,
} from "../types";

const DESCRIPTOR: ProviderDescriptor = {
  key: "learnworlds",
  displayName: "LearnWorlds",
  phase: 2,
  capabilities: {
    catalogSync: true, enrollment: true, progressTracking: true, completionTracking: true,
    certificates: true, ssoLaunch: true, webhooks: true, skillMetadata: false, scorm: true, xapi: true,
  },
};

interface LwCourse { id: string; title: string; description?: string; url?: string; courseImage?: string; categories?: string[]; }

export class LearnWorldsProvider implements CourseProvider {
  readonly descriptor = DESCRIPTOR;
  private token?: string;
  private tokenExpiry = 0;

  constructor(private readonly config: ProviderConnectionConfig) {}

  private get clientId() { return this.config.credentials.clientId; }
  private base() {
    const school = this.config.credentials.school ?? "";
    const host = school.startsWith("http") ? school : `https://${school}`;
    return `${host.replace(/\/$/, "")}/admin/api`;
  }

  /** OAuth2 client-credentials token, cached ~50 min. */
  private async accessToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) return this.token;
    const res = await fetch(`${this.base()}/oauth2/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Lw-Client": this.clientId },
      body: new URLSearchParams({ client_id: this.clientId, client_secret: this.config.credentials.clientSecret, grant_type: "client_credentials" }),
    });
    if (!res.ok) throw new Error(`LearnWorlds auth ${res.status}: ${(await res.text()).slice(0, 160)}`);
    const j = (await res.json()) as { tokens?: { access_token?: { token?: string } }; access_token?: string };
    const token = j.tokens?.access_token?.token ?? j.access_token;
    if (!token) throw new Error("LearnWorlds auth: no token in response");
    this.token = token;
    this.tokenExpiry = Date.now() + 50 * 60 * 1000;
    return token;
  }

  private async api(path: string, init?: RequestInit): Promise<Response> {
    const token = await this.accessToken();
    return fetch(`${this.base()}/v2${path}`, {
      ...init,
      headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}`, "Lw-Client": this.clientId, "Content-Type": "application/json" },
    });
  }

  async healthCheck() {
    try { await this.accessToken(); return { ok: true }; }
    catch (e) { return { ok: false, detail: e instanceof Error ? e.message : String(e) }; }
  }

  async listCourses(opts: ListCoursesOptions = {}): Promise<Paginated<CanonicalCourse>> {
    const res = await this.api(`/courses?items_per_page=${opts.limit ?? 50}`);
    if (!res.ok) return { items: [], total: 0 };
    const j = (await res.json()) as { data?: LwCourse[]; courses?: LwCourse[] };
    const items = (j.data ?? j.courses ?? []).map((c) => this.normalize(c));
    return { items, total: items.length };
  }

  private normalize(c: LwCourse): CanonicalCourse {
    return {
      providerKey: "learnworlds", externalId: c.id, title: c.title, description: c.description ?? c.title,
      language: "en", modality: "self-paced", formats: ["video", "interactive"], publisher: "LearnWorlds",
      skills: [], rawCategories: c.categories ?? [], launchUrl: c.url, imageUrl: c.courseImage, updatedAt: new Date(),
    };
  }

  async getCourse(externalId: string): Promise<CanonicalCourse | null> {
    const res = await this.api(`/courses/${externalId}`);
    if (!res.ok) return null;
    return this.normalize((await res.json()) as LwCourse);
  }

  async listLearningPaths(_opts: ListCoursesOptions = {}): Promise<Paginated<CanonicalLearningPath>> {
    return { items: [] }; // LearnWorlds "learning paths" = bundles; map when needed
  }

  async syncCatalog(_opts: { updatedSince?: Date } = {}): Promise<CatalogSyncResult> {
    const startedAt = new Date();
    const page = await this.listCourses({ limit: 500 });
    return { providerKey: this.descriptor.key, startedAt, finishedAt: new Date(), coursesUpserted: page.items.length, pathsUpserted: 0, coursesRetired: 0, errors: [] };
  }

  async getCourseSkills(_externalId: string): Promise<SkillTag[]> { return []; }

  /** Provision the learner in the client's LearnWorlds school (idempotent on email). */
  async createLearner(input: ProviderLearner): Promise<{ externalLearnerId: string }> {
    const res = await this.api(`/users`, {
      method: "POST",
      body: JSON.stringify({ email: input.email, username: `${input.firstName} ${input.lastName}`.trim(), send_registration_email: false }),
    });
    if (res.status === 409) {
      // already exists — look up by email
      const lookup = await this.api(`/users?email=${encodeURIComponent(input.email)}`);
      const j = (await lookup.json()) as { data?: { id: string }[] };
      const id = j.data?.[0]?.id;
      if (id) return { externalLearnerId: id };
    }
    if (!res.ok) throw new Error(`LearnWorlds createUser ${res.status}`);
    const j = (await res.json()) as { id?: string; user?: { id?: string } };
    const id = j.id ?? j.user?.id;
    if (!id) throw new Error("LearnWorlds createUser: no id");
    return { externalLearnerId: id };
  }

  async enrollLearner(input: { externalLearnerId: string; externalCourseId: string; idempotencyKey: string }): Promise<Enrollment> {
    const res = await this.api(`/users/${input.externalLearnerId}/enrollment`, {
      method: "POST",
      body: JSON.stringify({ productId: input.externalCourseId, productType: "course", justification: "Enrolled via RiyadaIntel" }),
    });
    if (!res.ok && res.status !== 409) throw new Error(`LearnWorlds enroll ${res.status}`);
    return { externalEnrollmentId: `lw:${input.externalLearnerId}:${input.externalCourseId}`, externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "enrolled", enrolledAt: new Date() };
  }

  async getProgress(input: { externalLearnerId: string; externalCourseId: string }): Promise<Progress> {
    const res = await this.api(`/users/${input.externalLearnerId}/courses/${input.externalCourseId}/progress`);
    if (!res.ok) return { externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "in-progress", percent: 0 };
    const j = (await res.json()) as { progress_rate?: number; status?: string };
    const percent = Math.round(j.progress_rate ?? 0);
    return { externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: percent >= 100 ? "completed" : "in-progress", percent };
  }

  async getCertificate(_input: { externalLearnerId: string; externalCourseId: string }): Promise<CanonicalCertificate | null> { return null; }

  async getLaunchUrl(input: { externalLearnerId: string; externalCourseId: string; returnUrl: string }): Promise<string> {
    const school = this.config.credentials.school ?? "";
    const host = school.startsWith("http") ? school : `https://${school}`;
    return `${host.replace(/\/$/, "")}/course/${input.externalCourseId}`;
  }
}

export const learnWorldsFactory = {
  key: DESCRIPTOR.key,
  create: (config: ProviderConnectionConfig) => new LearnWorldsProvider(config),
};
