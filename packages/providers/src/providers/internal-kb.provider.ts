/**
 * Internal Knowledge Base connector (Phase 4) — Confluence / SharePoint / Drive / M365 / Notion.
 * Proves that internal sources flow through the SAME PAL as any commercial provider: documents
 * are listed as "courses," and the AI Knowledge Academy (apps/api ai module) turns them into real
 * lessons + assessments. `source` selects which backend; all share this contract.
 */
import type {
  CourseProvider, ProviderConnectionConfig, ProviderDescriptor, ListCoursesOptions,
} from "../course-provider.interface";
import type {
  CanonicalCourse, CanonicalCertificate, CanonicalLearningPath, CatalogSyncResult,
  Enrollment, Paginated, Progress, ProviderLearner, SkillTag,
} from "../types";

export type InternalSource = "confluence" | "sharepoint" | "google-drive" | "m365" | "notion";

function descriptorFor(source: InternalSource): ProviderDescriptor {
  return {
    key: `internal:${source}`,
    displayName: `Internal — ${source}`,
    phase: 4,
    capabilities: {
      catalogSync: true, enrollment: true, progressTracking: true, completionTracking: true,
      certificates: true, ssoLaunch: false, webhooks: true, skillMetadata: false, scorm: false, xapi: true,
    },
  };
}

export class InternalKbProvider implements CourseProvider {
  readonly descriptor: ProviderDescriptor;
  constructor(private readonly source: InternalSource, private readonly config: ProviderConnectionConfig) {
    this.descriptor = descriptorFor(source);
  }

  async healthCheck() { return { ok: true, detail: `internal:${this.source} stub` }; }

  async listCourses(opts: ListCoursesOptions = {}): Promise<Paginated<CanonicalCourse>> {
    // TODO: list documents (pages/files/policies) from the backend; each becomes a draft course
    // that the AI Knowledge Academy expands into lessons + assessments + competency map.
    void opts; return { items: [], total: 0 };
  }
  async getCourse(externalId: string): Promise<CanonicalCourse | null> { void externalId; return null; }
  async listLearningPaths(opts: ListCoursesOptions = {}): Promise<Paginated<CanonicalLearningPath>> { void opts; return { items: [] }; }
  async syncCatalog(opts: { updatedSince?: Date } = {}): Promise<CatalogSyncResult> {
    void opts;
    const startedAt = new Date();
    return { providerKey: this.descriptor.key, startedAt, finishedAt: startedAt, coursesUpserted: 0, pathsUpserted: 0, coursesRetired: 0, errors: [] };
  }
  async getCourseSkills(externalId: string): Promise<SkillTag[]> { void externalId; return []; }
  async createLearner(input: ProviderLearner): Promise<{ externalLearnerId: string }> { return { externalLearnerId: input.internalUserId }; }
  async enrollLearner(input: { externalLearnerId: string; externalCourseId: string; idempotencyKey: string }): Promise<Enrollment> {
    return { externalEnrollmentId: `internal:${input.externalCourseId}`, externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "enrolled", enrolledAt: new Date() };
  }
  async getProgress(input: { externalLearnerId: string; externalCourseId: string }): Promise<Progress> {
    return { externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "in-progress", percent: 0 };
  }
  async getCertificate(input: { externalLearnerId: string; externalCourseId: string }): Promise<CanonicalCertificate | null> { void input; return null; }
}

export const internalKbFactories = (["confluence", "sharepoint", "google-drive", "m365", "notion"] as InternalSource[]).map(
  (source) => ({ key: `internal:${source}`, create: (config: ProviderConnectionConfig) => new InternalKbProvider(source, config) }),
);
