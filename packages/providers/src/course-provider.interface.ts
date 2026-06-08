/**
 * Provider Abstraction Layer (PAL)
 * --------------------------------
 * Every external learning provider — GO1, OpenSesame, Microsoft Learn, AWS Skill Builder,
 * Coursera, LinkedIn Learning, Udemy Business, Skillsoft, O'Reilly, DataCamp, Cybrary — and
 * every internal source (Confluence, SharePoint, Google Drive, M365, Notion, AI-generated
 * courses) plugs into RiyadaIntel through this single interface.
 *
 * This is the integration moat. The platform never special-cases a provider above this layer:
 * the catalog sync pipeline, the enrollment service, the progress tracker, and the skills
 * mapper all speak `CourseProvider`, not "GO1" or "Coursera".
 *
 * Design rules:
 *   1. Every method is idempotent where the provider allows it (enroll twice => same enrollment).
 *   2. Every returned entity is normalized to the canonical RiyadaIntel shape (see ./types).
 *   3. Capabilities are declared, not assumed — a provider that can't issue certificates
 *      declares `capabilities.certificates = false`, and the orchestrator routes around it.
 *   4. All identifiers crossing the boundary are *external* ids; the platform owns the mapping
 *      from (providerId, externalId) -> internal canonical id.
 */

import type {
  CanonicalCourse,
  CanonicalLearningPath,
  CanonicalCertificate,
  ProviderLearner,
  Enrollment,
  Progress,
  CatalogSyncResult,
  Paginated,
  SkillTag,
} from "./types";

/** What a given provider connector can actually do. The orchestrator honors these. */
export interface ProviderCapabilities {
  catalogSync: boolean;
  enrollment: boolean;
  progressTracking: boolean;
  completionTracking: boolean;
  certificates: boolean;
  ssoLaunch: boolean; // can deep-link a learner into the provider via SSO/LTI
  webhooks: boolean; // provider can push progress/completion events back to us
  skillMetadata: boolean; // provider exposes its own skill/competency tags
  scorm: boolean;
  xapi: boolean;
}

/** Stable metadata describing a connector instance for a given tenant. */
export interface ProviderDescriptor {
  /** Stable connector key, e.g. "go1", "open-sesame", "ms-learn", "aws-skill-builder". */
  readonly key: string;
  readonly displayName: string;
  readonly phase: 1 | 2 | 3 | 4;
  readonly capabilities: ProviderCapabilities;
}

export interface ListCoursesOptions {
  cursor?: string;
  limit?: number;
  updatedSince?: Date; // for incremental catalog sync
  query?: string;
  locale?: string;
}

/**
 * THE universal interface. Implement once per provider in src/providers/<key>.provider.ts.
 */
export interface CourseProvider {
  readonly descriptor: ProviderDescriptor;

  /** Verify credentials / connectivity for this tenant's connection. */
  healthCheck(): Promise<{ ok: boolean; detail?: string }>;

  // ---- Catalog ----
  listCourses(opts?: ListCoursesOptions): Promise<Paginated<CanonicalCourse>>;
  getCourse(externalId: string): Promise<CanonicalCourse | null>;
  listLearningPaths(opts?: ListCoursesOptions): Promise<Paginated<CanonicalLearningPath>>;

  /**
   * Full or incremental catalog synchronization into RiyadaIntel's normalized store.
   * Returns a delta summary so the sync orchestrator can report and reconcile.
   * Implementations should stream/paginate internally and honor `updatedSince`.
   */
  syncCatalog(opts?: { updatedSince?: Date }): Promise<CatalogSyncResult>;

  /**
   * Provider-native skill tags for a course, normalized to RiyadaIntel SkillTags. The Skills
   * Intelligence engine reconciles these against the canonical Skills Graph (see
   * docs/02-intelligence-engines.md). Empty array if the provider has no skill metadata.
   */
  getCourseSkills(externalId: string): Promise<SkillTag[]>;

  // ---- Learner lifecycle ----
  createLearner(input: ProviderLearner): Promise<{ externalLearnerId: string }>;
  enrollLearner(input: {
    externalLearnerId: string;
    externalCourseId: string;
    /** Idempotency key so retries don't double-enroll. */
    idempotencyKey: string;
  }): Promise<Enrollment>;

  // ---- Tracking ----
  getProgress(input: {
    externalLearnerId: string;
    externalCourseId: string;
  }): Promise<Progress>;
  getCertificate(input: {
    externalLearnerId: string;
    externalCourseId: string;
  }): Promise<CanonicalCertificate | null>;

  /**
   * Optional: produce an SSO/LTI launch URL so a learner enters the provider seamlessly.
   * Only called when `capabilities.ssoLaunch` is true.
   */
  getLaunchUrl?(input: {
    externalLearnerId: string;
    externalCourseId: string;
    returnUrl: string;
  }): Promise<string>;
}

/**
 * Connectors are constructed per-tenant with that tenant's stored credentials. The factory is
 * resolved from a registry keyed by descriptor.key — adding a provider is: implement the
 * interface, register the factory, ship. Nothing above this layer changes.
 */
export interface ProviderFactory {
  readonly key: string;
  create(config: ProviderConnectionConfig): CourseProvider;
}

export interface ProviderConnectionConfig {
  tenantId: string;
  organizationId: string;
  /** Encrypted-at-rest credentials, decrypted just-in-time by the connector runtime. */
  credentials: Record<string, string>;
  /** Optional per-tenant overrides (region, base URL, rate limits). */
  options?: Record<string, unknown>;
}
