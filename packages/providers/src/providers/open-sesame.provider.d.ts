/**
 * OpenSesame connector (Phase 1). Course aggregator (SCORM/AICC heavy). Same PAL contract as
 * GO1; HTTP calls are TODO seams for the build. Copy-of-pattern: this file is deliberately the
 * same shape as go1.provider.ts so connectors stay uniform.
 */
import type { CourseProvider, ProviderConnectionConfig, ProviderDescriptor, ListCoursesOptions } from "../course-provider.interface";
import type { CanonicalCourse, CanonicalCertificate, CanonicalLearningPath, CatalogSyncResult, Enrollment, Paginated, Progress, ProviderLearner, SkillTag } from "../types";
export declare class OpenSesameProvider implements CourseProvider {
    private readonly config;
    readonly descriptor: ProviderDescriptor;
    constructor(config: ProviderConnectionConfig);
    healthCheck(): Promise<{
        ok: boolean;
        detail: string;
    }>;
    listCourses(opts?: ListCoursesOptions): Promise<Paginated<CanonicalCourse>>;
    getCourse(externalId: string): Promise<CanonicalCourse | null>;
    listLearningPaths(opts?: ListCoursesOptions): Promise<Paginated<CanonicalLearningPath>>;
    syncCatalog(opts?: {
        updatedSince?: Date;
    }): Promise<CatalogSyncResult>;
    getCourseSkills(externalId: string): Promise<SkillTag[]>;
    createLearner(input: ProviderLearner): Promise<{
        externalLearnerId: string;
    }>;
    enrollLearner(input: {
        externalLearnerId: string;
        externalCourseId: string;
        idempotencyKey: string;
    }): Promise<Enrollment>;
    getProgress(input: {
        externalLearnerId: string;
        externalCourseId: string;
    }): Promise<Progress>;
    getCertificate(input: {
        externalLearnerId: string;
        externalCourseId: string;
    }): Promise<CanonicalCertificate | null>;
}
export declare const openSesameFactory: {
    key: string;
    create: (config: ProviderConnectionConfig) => OpenSesameProvider;
};
