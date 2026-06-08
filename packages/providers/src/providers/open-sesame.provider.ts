/**
 * OpenSesame connector (Phase 1). Course aggregator (SCORM/AICC heavy). Same PAL contract as
 * GO1; HTTP calls are TODO seams for the build. Copy-of-pattern: this file is deliberately the
 * same shape as go1.provider.ts so connectors stay uniform.
 */
import type {
  CourseProvider,
  ProviderConnectionConfig,
  ProviderDescriptor,
  ListCoursesOptions,
} from "../course-provider.interface";
import type {
  CanonicalCourse, CanonicalCertificate, CanonicalLearningPath, CatalogSyncResult,
  Enrollment, Paginated, Progress, ProviderLearner, SkillTag,
} from "../types";

const DESCRIPTOR: ProviderDescriptor = {
  key: "open-sesame",
  displayName: "OpenSesame",
  phase: 1,
  capabilities: {
    catalogSync: true, enrollment: true, progressTracking: true, completionTracking: true,
    certificates: true, ssoLaunch: true, webhooks: true, skillMetadata: true, scorm: true, xapi: true,
  },
};

export class OpenSesameProvider implements CourseProvider {
  readonly descriptor = DESCRIPTOR;
  constructor(private readonly config: ProviderConnectionConfig) {}

  async healthCheck() { return { ok: true, detail: "stub" }; }

  async listCourses(opts: ListCoursesOptions = {}): Promise<Paginated<CanonicalCourse>> {
    void opts; return { items: [], total: 0 }; // TODO: GET /v1/courses?modified_since=
  }
  async getCourse(externalId: string): Promise<CanonicalCourse | null> { void externalId; return null; }
  async listLearningPaths(opts: ListCoursesOptions = {}): Promise<Paginated<CanonicalLearningPath>> {
    void opts; return { items: [] };
  }
  async syncCatalog(opts: { updatedSince?: Date } = {}): Promise<CatalogSyncResult> {
    void opts;
    const startedAt = new Date();
    return { providerKey: this.descriptor.key, startedAt, finishedAt: startedAt, coursesUpserted: 0, pathsUpserted: 0, coursesRetired: 0, errors: [] };
  }
  async getCourseSkills(externalId: string): Promise<SkillTag[]> { void externalId; return []; }
  async createLearner(input: ProviderLearner): Promise<{ externalLearnerId: string }> { void input; return { externalLearnerId: "stub" }; }
  async enrollLearner(input: { externalLearnerId: string; externalCourseId: string; idempotencyKey: string }): Promise<Enrollment> {
    return { externalEnrollmentId: "stub", externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "enrolled", enrolledAt: new Date() };
  }
  async getProgress(input: { externalLearnerId: string; externalCourseId: string }): Promise<Progress> {
    return { externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "in-progress", percent: 0 };
  }
  async getCertificate(input: { externalLearnerId: string; externalCourseId: string }): Promise<CanonicalCertificate | null> { void input; return null; }
}

export const openSesameFactory = {
  key: DESCRIPTOR.key,
  create: (config: ProviderConnectionConfig) => new OpenSesameProvider(config),
};
