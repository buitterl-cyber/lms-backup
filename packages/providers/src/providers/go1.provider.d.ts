/**
 * GO1 connector (Phase 1) — reference implementation of the Provider Abstraction Layer.
 *
 * This is a production-shaped skeleton: the contract, normalization, pagination, idempotency,
 * and capability declaration are real; the HTTP calls are marked TODO so the MVP build plan
 * (docs/05) can wire the GO1 OAuth2 client + endpoints. Use this file as the template for
 * every other connector — copy, rename, fill the TODOs.
 */
import type { CourseProvider, ProviderConnectionConfig, ProviderDescriptor, ListCoursesOptions } from "../course-provider.interface";
import type { CanonicalCourse, CanonicalCertificate, CanonicalLearningPath, CatalogSyncResult, Enrollment, Paginated, Progress, ProviderLearner, SkillTag } from "../types";
export declare class Go1Provider implements CourseProvider {
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
    getLaunchUrl(input: {
        externalLearnerId: string;
        externalCourseId: string;
        returnUrl: string;
    }): Promise<string>;
}
export declare const go1Factory: {
    key: string;
    create: (config: ProviderConnectionConfig) => Go1Provider;
};
