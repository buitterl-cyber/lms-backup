/**
 * Internal Knowledge Base connector (Phase 4) — Confluence / SharePoint / Drive / M365 / Notion.
 * Proves that internal sources flow through the SAME PAL as any commercial provider: documents
 * are listed as "courses," and the AI Knowledge Academy (apps/api ai module) turns them into real
 * lessons + assessments. `source` selects which backend; all share this contract.
 */
import type { CourseProvider, ProviderConnectionConfig, ProviderDescriptor, ListCoursesOptions } from "../course-provider.interface";
import type { CanonicalCourse, CanonicalCertificate, CanonicalLearningPath, CatalogSyncResult, Enrollment, Paginated, Progress, ProviderLearner, SkillTag } from "../types";
export type InternalSource = "confluence" | "sharepoint" | "google-drive" | "m365" | "notion";
export declare class InternalKbProvider implements CourseProvider {
    private readonly source;
    private readonly config;
    readonly descriptor: ProviderDescriptor;
    constructor(source: InternalSource, config: ProviderConnectionConfig);
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
export declare const internalKbFactories: {
    key: string;
    create: (config: ProviderConnectionConfig) => InternalKbProvider;
}[];
