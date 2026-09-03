/**
 * Test-only GO1 provider double — implements the full `CourseProvider` interface against the
 * fixture in ./go1-sample-response.json instead of a real HTTP call, so the platform side of the
 * integration (catalog sync, enrollment, progress, certificates, SSO launch) can be exercised
 * end-to-end before we have real GO1 sandbox credentials.
 *
 * NOT registered in the production registry (registry.ts) — it's exported only for use from
 * tests / manual verification scripts. The fixture's shape is an inferred placeholder (see the
 * JSON file's `_comment`), so this proves the *contract* works, not that it matches GO1's real
 * response format.
 */
import type {
  CourseProvider,
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
import sample from "./go1-sample-response.json";

const DESCRIPTOR: ProviderDescriptor = {
  key: "go1",
  displayName: "GO1 (mock)",
  phase: 1,
  capabilities: {
    catalogSync: true, enrollment: true, progressTracking: true, completionTracking: true,
    certificates: true, ssoLaunch: true, webhooks: true, skillMetadata: true, scorm: true, xapi: true,
  },
};

interface RawLearningObject {
  id: string;
  type: string;
  title: string;
  description: string;
  language?: string;
  duration_seconds?: number;
  level?: string;
  delivery?: string;
  tags?: string[];
  image_url?: string;
  launch_url?: string;
  publisher?: string;
  items?: string[];
  updated_at: string;
}

interface EnrollmentRecord {
  externalEnrollmentId: string;
  externalLearnerId: string;
  externalCourseId: string;
  status: Enrollment["status"];
  percent: number;
  score?: number;
  enrolledAt: Date;
  completedAt?: Date;
}

/** In-memory double: real learner/enrollment state, fixture-backed catalog. One instance per
 *  test/script — state does not persist across instances or processes. */
export class MockGo1Provider implements CourseProvider {
  readonly descriptor = DESCRIPTOR;

  private readonly learners = new Map<string, { internalUserId: string; email: string }>(); // externalLearnerId -> learner
  private readonly enrollments = new Map<string, EnrollmentRecord>(); // `${externalLearnerId}:${externalCourseId}` -> record

  async healthCheck() {
    return { ok: true, detail: "mock" };
  }

  async listCourses(opts: ListCoursesOptions = {}): Promise<Paginated<CanonicalCourse>> {
    const items = rawItems()
      .filter((lo) => lo.type === "course")
      .map(normalizeCourse)
      .filter((c) => !opts.query || c.title.toLowerCase().includes(opts.query.toLowerCase()))
      .slice(0, opts.limit ?? 100);
    return { items, total: items.length };
  }

  async getCourse(externalId: string): Promise<CanonicalCourse | null> {
    const lo = rawItems().find((x) => x.id === externalId && x.type === "course");
    return lo ? normalizeCourse(lo) : null;
  }

  async listLearningPaths(opts: ListCoursesOptions = {}): Promise<Paginated<CanonicalLearningPath>> {
    const items = rawItems()
      .filter((lo) => lo.type === "learning_pathway")
      .map(normalizePath)
      .slice(0, opts.limit ?? 100);
    return { items };
  }

  async syncCatalog(): Promise<CatalogSyncResult> {
    const startedAt = new Date();
    const courses = await this.listCourses({ limit: 10_000 });
    const paths = await this.listLearningPaths({ limit: 10_000 });
    return {
      providerKey: this.descriptor.key,
      startedAt,
      finishedAt: new Date(),
      coursesUpserted: courses.items.length,
      pathsUpserted: paths.items.length,
      coursesRetired: 0,
      errors: [],
    };
  }

  async getCourseSkills(externalId: string): Promise<SkillTag[]> {
    const lo = rawItems().find((x) => x.id === externalId);
    return (lo?.tags ?? []).map((raw) => ({ raw, canonicalSkillId: null, confidence: 0.7 }));
  }

  async createLearner(input: ProviderLearner): Promise<{ externalLearnerId: string }> {
    // Idempotent on email, like the real interface promises.
    const existing = [...this.learners.entries()].find(([, l]) => l.email === input.email);
    if (existing) return { externalLearnerId: existing[0] };
    const externalLearnerId = `mock-learner-${this.learners.size + 1}`;
    this.learners.set(externalLearnerId, { internalUserId: input.internalUserId, email: input.email });
    return { externalLearnerId };
  }

  async enrollLearner(input: { externalLearnerId: string; externalCourseId: string; idempotencyKey: string }): Promise<Enrollment> {
    const key = `${input.externalLearnerId}:${input.externalCourseId}`;
    const existing = this.enrollments.get(key);
    if (existing) return { ...existing };
    const record: EnrollmentRecord = {
      externalEnrollmentId: `mock-enr-${input.idempotencyKey}`,
      externalLearnerId: input.externalLearnerId,
      externalCourseId: input.externalCourseId,
      status: "enrolled",
      percent: 0,
      enrolledAt: new Date(),
    };
    this.enrollments.set(key, record);
    return { ...record };
  }

  async getProgress(input: { externalLearnerId: string; externalCourseId: string }): Promise<Progress> {
    const record = this.enrollments.get(`${input.externalLearnerId}:${input.externalCourseId}`);
    if (!record) return { externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "enrolled", percent: 0 };
    return {
      externalLearnerId: record.externalLearnerId,
      externalCourseId: record.externalCourseId,
      status: record.status,
      percent: record.percent,
      score: record.score,
      completedAt: record.completedAt,
    };
  }

  async getCertificate(input: { externalLearnerId: string; externalCourseId: string }): Promise<CanonicalCertificate | null> {
    const record = this.enrollments.get(`${input.externalLearnerId}:${input.externalCourseId}`);
    if (!record || record.status !== "completed") return null;
    return {
      externalLearnerId: record.externalLearnerId,
      externalCourseId: record.externalCourseId,
      certificateId: `mock-cert-${record.externalEnrollmentId}`,
      issuedAt: record.completedAt ?? new Date(),
      cpdHours: 1,
    };
  }

  async getLaunchUrl(input: { externalLearnerId: string; externalCourseId: string; returnUrl: string }): Promise<string> {
    void input.externalLearnerId;
    return `https://example.invalid/launch/${input.externalCourseId}?return=${encodeURIComponent(input.returnUrl)}`;
  }

  /** Test helper — advance an enrollment's progress and flip it to completed at 100%.
   *  Not part of the CourseProvider contract; only the mock exposes it, to simulate the
   *  webhook/poll event a real provider would eventually deliver. */
  simulateProgress(externalLearnerId: string, externalCourseId: string, percent: number) {
    const key = `${externalLearnerId}:${externalCourseId}`;
    const record = this.enrollments.get(key);
    if (!record) throw new Error(`No mock enrollment for ${key}`);
    record.percent = Math.min(100, Math.max(0, percent));
    record.status = record.percent >= 100 ? "completed" : "in-progress";
    if (record.status === "completed") record.completedAt = new Date();
  }
}

function rawItems(): RawLearningObject[] {
  return (sample as { data: RawLearningObject[] }).data;
}

function normalizeCourse(lo: RawLearningObject): CanonicalCourse {
  const levels = new Set(["beginner", "intermediate", "advanced", "expert"]);
  return {
    providerKey: "go1",
    externalId: lo.id,
    title: lo.title,
    description: lo.description,
    language: lo.language ?? "en",
    durationMinutes: lo.duration_seconds ? Math.round(lo.duration_seconds / 60) : undefined,
    modality: (lo.delivery as CanonicalCourse["modality"]) ?? "self-paced",
    formats: ["interactive"],
    level: levels.has(lo.level ?? "") ? (lo.level as CanonicalCourse["level"]) : undefined,
    imageUrl: lo.image_url,
    launchUrl: lo.launch_url,
    publisher: lo.publisher,
    skills: (lo.tags ?? []).map((raw) => ({ raw, canonicalSkillId: null, confidence: 0.7 })),
    rawCategories: lo.tags ?? [],
    updatedAt: new Date(lo.updated_at),
  };
}

function normalizePath(lo: RawLearningObject): CanonicalLearningPath {
  return {
    providerKey: "go1",
    externalId: lo.id,
    title: lo.title,
    description: lo.description,
    courseExternalIds: lo.items ?? [],
    skills: (lo.tags ?? []).map((raw) => ({ raw, canonicalSkillId: null, confidence: 0.7 })),
    updatedAt: new Date(lo.updated_at),
  };
}
