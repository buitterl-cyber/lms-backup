/**
 * Microsoft Learn connector (Phase 1). Free modules + learning paths; certifications are
 * Microsoft credentials. No paid enrollment — "enroll" means start/track. SSO/deep-link yes.
 */
import type {
  CourseProvider, ProviderConnectionConfig, ProviderDescriptor, ListCoursesOptions,
} from "../course-provider.interface";
import type {
  CanonicalCourse, CanonicalCertificate, CanonicalLearningPath, CatalogSyncResult,
  Enrollment, Paginated, Progress, ProviderLearner, SkillTag,
} from "../types";

interface MsModule {
  uid: string;
  title: string;
  summary?: string;
  duration_in_minutes?: number;
  levels?: string[];
  roles?: string[];
  products?: string[];
  subjects?: string[];
  url?: string;
  icon_url?: string;
  social_image_url?: string;
}

const DESCRIPTOR: ProviderDescriptor = {
  key: "ms-learn",
  displayName: "Microsoft Learn",
  phase: 1,
  capabilities: {
    catalogSync: true, enrollment: false, progressTracking: true, completionTracking: true,
    certificates: true, ssoLaunch: true, webhooks: false, skillMetadata: true, scorm: false, xapi: true,
  },
};

export class MsLearnProvider implements CourseProvider {
  readonly descriptor = DESCRIPTOR;
  constructor(private readonly config: ProviderConnectionConfig) {}

  async healthCheck() { return { ok: true, detail: "stub" }; }

  async listCourses(opts: ListCoursesOptions = {}): Promise<Paginated<CanonicalCourse>> {
    // Real pull from the public Microsoft Learn catalog API (no auth). Filtered to workforce-
    // relevant topics and capped for the demo; production would page the full ~3,600 modules.
    const res = await fetch(`https://learn.microsoft.com/api/catalog/?locale=${opts.locale ?? "en-us"}`);
    if (!res.ok) return { items: [], total: 0 };
    const data = (await res.json()) as { modules?: MsModule[] };
    const RELEVANT = ["security", "azure", "identity", "compliance", "network", "devops", "cloud", "data", "ai-", "governance"];
    const modules = (data.modules ?? []).filter((m) => {
      const tags = [...(m.subjects ?? []), ...(m.products ?? []), ...(m.roles ?? [])].join(" ").toLowerCase();
      return RELEVANT.some((r) => tags.includes(r));
    });
    const items = modules.slice(0, opts.limit ?? 120).map((m) => this.normalize(m));
    return { items, total: items.length };
  }

  async getCourse(externalId: string): Promise<CanonicalCourse | null> {
    const page = await this.listCourses({ limit: 4000 });
    return page.items.find((c) => c.externalId === externalId) ?? null;
  }

  private normalize(m: MsModule): CanonicalCourse {
    const tagLabel = (s: string) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const levels = new Set(["beginner", "intermediate", "advanced"]);
    const level = m.levels?.find((l) => levels.has(l)) as CanonicalCourse["level"] | undefined;
    return {
      providerKey: "ms-learn",
      externalId: m.uid,
      title: m.title,
      description: m.summary ?? m.title,
      language: "en",
      durationMinutes: m.duration_in_minutes,
      modality: "self-paced",
      formats: ["interactive"],
      level,
      imageUrl: m.social_image_url ?? m.icon_url,
      launchUrl: m.url,
      publisher: "Microsoft",
      skills: [...(m.subjects ?? []), ...(m.roles ?? [])].map((raw) => ({ raw: tagLabel(raw), canonicalSkillId: null, confidence: 0.7 })),
      rawCategories: m.products ?? [],
      updatedAt: new Date(),
    };
  }
  async listLearningPaths(opts: ListCoursesOptions = {}): Promise<Paginated<CanonicalLearningPath>> {
    // TODO: GET catalog?type=learningPaths
    void opts; return { items: [] };
  }
  async syncCatalog(opts: { updatedSince?: Date } = {}): Promise<CatalogSyncResult> {
    void opts;
    const startedAt = new Date();
    return { providerKey: this.descriptor.key, startedAt, finishedAt: startedAt, coursesUpserted: 0, pathsUpserted: 0, coursesRetired: 0, errors: [] };
  }
  async getCourseSkills(externalId: string): Promise<SkillTag[]> {
    // MS Learn modules carry roles/products/subjects — map to SkillTags for the reconciler.
    void externalId; return [];
  }
  async createLearner(input: ProviderLearner): Promise<{ externalLearnerId: string }> {
    // MS Learn has no portal user; we key progress by the platform user via xAPI.
    return { externalLearnerId: input.internalUserId };
  }
  async enrollLearner(input: { externalLearnerId: string; externalCourseId: string; idempotencyKey: string }): Promise<Enrollment> {
    // Free content: "enroll" records intent + deep-links the learner.
    return { externalEnrollmentId: `mslearn:${input.externalCourseId}`, externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "enrolled", enrolledAt: new Date() };
  }
  async getProgress(input: { externalLearnerId: string; externalCourseId: string }): Promise<Progress> {
    return { externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "in-progress", percent: 0 };
  }
  async getCertificate(input: { externalLearnerId: string; externalCourseId: string }): Promise<CanonicalCertificate | null> { void input; return null; }

  async getLaunchUrl(input: { externalLearnerId: string; externalCourseId: string; returnUrl: string }): Promise<string> {
    return `https://learn.microsoft.com/training/modules/${input.externalCourseId}/`;
  }
}

export const msLearnFactory = {
  key: DESCRIPTOR.key,
  create: (config: ProviderConnectionConfig) => new MsLearnProvider(config),
};
