/**
 * Canonical, provider-agnostic shapes. Every connector normalizes into these so the rest of
 * the platform never sees a provider's native schema.
 */
export interface Paginated<T> {
    items: T[];
    nextCursor?: string;
    total?: number;
}
export type CourseModality = "self-paced" | "instructor-led" | "blended" | "live" | "micro";
export type ContentFormat = "video" | "scorm" | "xapi" | "article" | "interactive" | "assessment";
export interface SkillTag {
    /** Provider's raw label, preserved for audit. */
    raw: string;
    /** Resolved canonical skill id once reconciled against the Skills Graph; null until matched. */
    canonicalSkillId: string | null;
    confidence: number;
}
export interface CanonicalCourse {
    providerKey: string;
    externalId: string;
    title: string;
    description: string;
    language: string;
    durationMinutes?: number;
    modality: CourseModality;
    formats: ContentFormat[];
    level?: "beginner" | "intermediate" | "advanced" | "expert";
    imageUrl?: string;
    publisher?: string;
    skills: SkillTag[];
    /** Provider-native taxonomy strings, kept for the skills reconciler. */
    rawCategories: string[];
    updatedAt: Date;
}
export interface CanonicalLearningPath {
    providerKey: string;
    externalId: string;
    title: string;
    description: string;
    courseExternalIds: string[];
    skills: SkillTag[];
    updatedAt: Date;
}
export interface ProviderLearner {
    internalUserId: string;
    email: string;
    firstName: string;
    lastName: string;
    locale?: string;
}
export type EnrollmentStatus = "enrolled" | "in-progress" | "completed" | "failed" | "expired";
export interface Enrollment {
    externalEnrollmentId: string;
    externalLearnerId: string;
    externalCourseId: string;
    status: EnrollmentStatus;
    enrolledAt: Date;
}
export interface Progress {
    externalLearnerId: string;
    externalCourseId: string;
    status: EnrollmentStatus;
    percent: number;
    score?: number;
    lastActivityAt?: Date;
    completedAt?: Date;
}
export interface CanonicalCertificate {
    externalLearnerId: string;
    externalCourseId: string;
    certificateId: string;
    issuedAt: Date;
    expiresAt?: Date;
    url?: string;
    /** CPD/CEU hours if the provider reports them — fuels Certification Intelligence. */
    cpdHours?: number;
}
export interface CatalogSyncResult {
    providerKey: string;
    startedAt: Date;
    finishedAt: Date;
    coursesUpserted: number;
    pathsUpserted: number;
    coursesRetired: number;
    errors: {
        externalId?: string;
        message: string;
    }[];
}
