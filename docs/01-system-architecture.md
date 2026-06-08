# RiyadaIntel — System & Infrastructure Architecture (Part 2 of 6)

Covers deliverables **7 Full System Architecture · 8 Service Architecture · 9 Provider
Integration Architecture · 19 Event-Driven Architecture · 20 Security Architecture ·
21 Multi-Tenant Architecture · 22 Kubernetes Architecture · 23 Infrastructure Architecture ·
24 CI/CD Design.**

---

## 7. Full System Architecture

Seven logical layers, mapped to the strategic model:

```
        ┌──────────────────────────────────────────────────────────────┐
 Clients│  Next.js web (App Router, RTL/i18n, PWA)   React Native (later)│
        └───────────────┬──────────────────────────────────────────────┘
                        │ HTTPS / OIDC (Keycloak)
        ┌───────────────▼──────────────────────────────────────────────┐
 Edge   │  API Gateway: authN (OIDC), tenant resolution, RBAC, rate-limit│
        └───────────────┬──────────────────────────────────────────────┘
        ┌───────────────▼──────────────────────────────────────────────┐
 App    │  NestJS modular backend (modules = domains)                   │
        │  identity · catalog · lms · assessments · skills · career ·   │
        │  compliance · certification · recommendations · marketplace · │
        │  reporting · notifications · ai                               │
        └──┬───────────────┬───────────────┬──────────────┬────────────┘
           │               │               │              │
   ┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼─────┐ ┌──────▼─────────┐
   │ PAL (providers)│ RIYADA AI    │ Event bus    │ Search (Meili)  │
   │ GO1/MSLearn/...│ LLM router+  │ (RabbitMQ)   │ Catalog index   │
   │ + internal KB  │ RAG+agents   │              │                 │
   └───────┬──────┘ └──────┬──────┘ └──────┬─────┘ └─────────────────┘
        ┌──▼───────────────▼───────────────▼─────────────────────────┐
 Data   │ PostgreSQL (OLTP, RLS)  Redis (cache/locks)  ClickHouse     │
        │ (analytics + xAPI LRS)  S3/R2 (content/files)               │
        └─────────────────────────────────────────────────────────────┘
```

Request-path stays fast; the **intelligence recomputation** (skills inference, gap analysis,
compliance risk, certification expiry, recommendations) runs as **event-driven background
jobs** so dashboards read precomputed state.

## 8. Service Architecture

Start as a **modular monolith** (one NestJS deploy, hard module boundaries) — the right choice
for a startup: one codebase, one transaction boundary, fast iteration. Each module owns its
tables and exposes an internal interface, so it can be **extracted into a microservice** without
a rewrite when scale demands. First extractions, in order: (1) **AI service** (different scaling
+ GPU/cost profile), (2) **provider-sync workers** (bursty, isolation), (3) **LRS/analytics
ingest** (write-heavy), (4) **reporting/export** (CPU-heavy). Communication: synchronous via
gateway, asynchronous via RabbitMQ events. No module reaches into another module's tables —
only via its service interface or domain events.

## 9. Provider Integration Architecture

The **Provider Abstraction Layer** (`packages/providers`) is the integration moat. One
interface, `CourseProvider`, with declared `capabilities`. The platform speaks the interface,
never a vendor.

```
 catalog/lms/skills modules ── speak ──► CourseProvider (universal interface)
                                              ▲
                          registry.ts ───────┘  (key -> factory)
        ┌──────────────┬──────────────┬───────────────┬──────────────────┐
   Phase1 GO1   OpenSesame  MS Learn  AWS SkillBuilder │ Phase2 LinkedIn/Coursera/Udemy
        └──────────────┴──────────────┴───────────────┴──────────────────┘
   Phase3 Skillsoft/O'Reilly/DataCamp/Cybrary   Phase4 AI-gen + Confluence/SharePoint/Drive/M365/Notion
```

**Sync pipeline (event-driven):** a scheduled `catalog.sync.requested` event per connection →
worker calls `provider.syncCatalog({updatedSince})` → upserts `Course`/`LearningPath` →
`getCourseSkills()` feeds the **skills reconciler** which maps raw provider tags to canonical
`Skill`s (string match → embedding similarity → human review queue) → reindex Meilisearch.
Enrollment is idempotent (`idempotencyKey`); progress arrives via webhook (capability
`webhooks`) or pull. Internal sources (Phase 4) implement the *same* interface — a SharePoint
connector lists documents as "courses," and the AI Knowledge Academy turns them into real
lessons/assessments. **Adding a provider changes nothing above the PAL.**

## 19. Event-Driven Architecture

RabbitMQ topic exchange `riyada.events`. Events are tenant-stamped, versioned, idempotent.

| Event | Producer | Consumers / effect |
|---|---|---|
| `catalog.sync.requested` | scheduler | provider-sync worker |
| `catalog.course.upserted` | sync worker | skills reconciler, search indexer |
| `enrollment.completed` | lms | skills (level up), certification, recommendations, notify |
| `certificate.earned` | certification | skills, compliance recompute |
| `certification.expiring` | expiry sweep | notifications (renewal campaign), compliance |
| `skills.profile.changed` | skills | gap analysis, recommendations, career replan |
| `compliance.risk.recomputed` | compliance | dashboards, notifications (red alerts) |
| `recommendation.created` | reco engine | notify, optional auto-assignment |
| `document.ingested` | AI Knowledge Academy | course generation pipeline |

Outbox pattern for reliable publish; consumers are idempotent; dead-letter queue + retry with
backoff. This decoupling is what lets the intelligence layer recompute continuously without
slowing the request path.

## 20. Security Architecture

- **Identity:** Keycloak (OIDC). SSO (SAML/OIDC) + SCIM provisioning for enterprise/gov; MFA
  enforced by policy per role; social/email for SMB.
- **AuthZ:** RBAC with fine-grained permission strings + scope (org/dept/team subtree). Guards
  at the gateway and per-resolver. 13 user types (see doc 03 / RBAC).
- **Tenant isolation:** `tenantId` on every row, AsyncLocalStorage tenant context, **Postgres
  Row-Level Security** policies as defense-in-depth so a query without tenant scope returns
  nothing. Provider credentials encrypted at rest (KMS envelope), decrypted just-in-time.
- **Data:** encryption in transit (TLS 1.3) and at rest; field-level encryption for secrets;
  data-residency by region (eu/me/africa/asia) at the infra layer. Retention policies + right-
  to-erasure (GDPR). **Append-only audit log** (DB-enforced INSERT-only) for every sensitive
  action.
- **Posture:** SOC2-ready controls, GDPR-ready DSAR flows, security monitoring (OTel + SIEM),
  secrets in a vault, least-privilege IAM, dependency/secret scanning in CI. Pen-test before GA.

## 21. Multi-Tenant Architecture

- **Hierarchy:** Platform → Organization → Division → Department → Team → User. Every record
  carries `tenantId` + `organizationId` (see schema).
- **Isolation model:** shared database, shared schema, **RLS-enforced** row isolation — best
  density for 1M+ learners. Enterprise/gov tenants that require it get a **dedicated database or
  dedicated cluster** (same code path; connection routed by tenant). Pluggable so you can move a
  big tenant to its own DB without code changes.
- **Per-tenant config:** white-label branding, custom domain (wildcard TLS + tenant resolution
  by host), regional settings, multi-currency, multi-language (en/ar + RTL), feature flags.

## 22. Kubernetes Architecture

- **Cluster topology:** regional clusters (EKS in eu-/me-/etc.; AKS where Azure/gov requires).
  Namespaces per environment; per-region for data residency.
- **Workloads:** `api` (HPA on CPU/RPS), `web` (Next.js), `workers` (provider-sync, expiry-sweep,
  risk-recompute, AI batch — KEDA-scaled on RabbitMQ queue depth), `ai-gateway`. Stateful
  dependencies on managed services, not in-cluster.
- **Platform:** Ingress-NGINX + cert-manager (wildcard for custom domains), External Secrets
  Operator (vault), OTel collector, Prometheus/Grafana, network policies, PodSecurity. Blue/green
  or canary via Argo Rollouts.

## 23. Infrastructure Architecture

- **IaC:** Terraform for everything (VPC, EKS/AKS, RDS/Aurora Postgres, ElastiCache Redis,
  Amazon MQ/RabbitMQ, ClickHouse Cloud, S3/R2, KMS, IAM, Keycloak). Modules per environment;
  multi-region for residency + DR.
- **Storage:** S3 (primary) / Cloudflare R2 (egress-cheap CDN-fronted) for content, SCORM
  packages, certificates, uploads. CloudFront/Cloudflare CDN in front of web + content.
- **Resilience:** multi-AZ managed DBs, automated backups + PITR, cross-region read replica for
  DR, RPO/RTO targets per tenant tier.

## 24. CI/CD Design

- **GitHub Actions:** PR pipeline = lint + typecheck + unit/integration tests (Postgres service
  container) + `prisma migrate diff` check + build. Affected-only via Turborepo remote cache.
- **Delivery:** build/push container images (api, web, workers) → deploy to staging on merge to
  `main` → smoke tests → manual gate → canary to prod via Argo Rollouts. DB migrations run as a
  pre-deploy job, backward-compatible (expand/contract). SBOM + image scan + secret scan gate
  the build. Per-PR preview environments for the web app.

→ Continue to `02-intelligence-engines.md`.
