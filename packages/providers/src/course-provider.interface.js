"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
