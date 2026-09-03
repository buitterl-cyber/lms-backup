# RiyadaIntel — Technical Overview

**Prepared:** 2026-08-13
**Audience:** internal (CTO) and external technical partners (e.g. GO1 integration discussions)
**Method:** everything below was verified directly against the running production code and live
infrastructure on 2026-08-13, not against design docs — where the repo's own docs (`CLAUDE.md`,
`BUILD.md`) were found to be slightly out of date, the code was treated as the source of truth
and the discrepancy is flagged.

---

## 1. Tech Stack

**Frontend** — Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Recharts for
charts, `flag-icons` for locale flags. RTL (Arabic) and dark mode are first-class, not bolted on.

**Backend** — NestJS 11 on Node.js 22, TypeScript. `class-validator`/`class-transformer` for
request validation, `helmet` for HTTP hardening, `@nestjs/throttler` for rate limiting,
`@nestjs/swagger` for auto-generated OpenAPI docs, `jsonwebtoken` + `bcryptjs` for auth,
`nodemailer` for outbound email.

**Database** — PostgreSQL 16, accessed via Prisma ORM 7 (`@prisma/adapter-pg`). 60 models in one
schema, single OLTP system of record.

**Search** — Meilisearch, used for course-catalog search with an automatic ILIKE/Postgres
fallback if Meilisearch is unreachable.

**AI** — Anthropic Claude (`claude-opus-4-8`) via the official SDK as the default reasoning
model, behind a provider-neutral router that also has OpenAI, Gemini, and local-LLM HTTP adapters
wired (so the model isn't hard-coded to one vendor).

**Monorepo tooling** — pnpm workspaces + Turborepo. One repo, four shared packages
(`database`, `providers`, `intelligence`, `shared`) consumed by two apps (`api`, `web`).

**Hosting** — a single Linux VPS. PM2 runs the compiled production builds: `riyada-api`
(`apps/api/dist/main.js`, port 4400) and `riyada-web` (`next start -p 3300`). Apache (cPanel/
WHM-managed on this box) reverse-proxies `riyadaintel.com` — `/api/*` to 4400, everything else to
3300. Postgres 16 and Meilisearch run as Docker containers, each bound to `127.0.0.1` only (not
exposed to the internet directly).

**Referenced but not currently running in production**: Redis, RabbitMQ, ClickHouse, and
Keycloak all appear in `docker-compose` and `.env` variable names, and the code has interfaces
designed around them (an event bus meant to sit on RabbitMQ, an analytics store meant to be
ClickHouse, federated identity meant to be Keycloak). None of these four are actually live —
`docker ps` on the production box shows only the Postgres and Meilisearch containers. This is
intentional architecture-ahead-of-infrastructure, not a bug, but it's worth knowing which
pieces are real today vs. planned. See §6.

---

## 2. Architecture Overview

### Shape

```
apps/web  (Next.js, browser + SSR)
    │  fetch, Bearer JWT
    ▼
apps/api  (NestJS modular monolith, :4400)
    │  imports
    ├── packages/shared        (RBAC, tenant context, domain errors)
    ├── packages/intelligence  (skill-gap, compliance, career, cert, recommendation logic — framework-free)
    ├── packages/providers     (Provider Abstraction Layer — GO1 etc.)
    └── packages/database      (Prisma client + schema)
            │
            ▼
      PostgreSQL 16 (single instance, Docker, localhost-only)
```

`apps/api` is one NestJS process — a **modular monolith**, not microservices. 24 feature modules
live under `apps/api/src/modules/*` (identity, skills, workforce, recommendations, compliance,
certification, career, catalog, enrollment, assessments, providers, marketplace, notifications,
reporting, ai, auth, forums, gamification, instructor, sales, errors, analytics, demo — plus a
top-level `jobs` module). The rule enforced by convention (not yet by tooling) is that no module
reaches into another module's database tables directly — only through that module's own service
or the internal event bus. This is explicitly the seam the team would cut along if/when parts of
this need to become separate services later (AI, provider sync, reporting are named as the first
candidates in the repo's own notes).

`packages/intelligence` is worth calling out specifically: it's the actual product logic (skill
gap analysis, compliance scoring, certification expiry, explainable recommendations, career
roadmap generation, workforce shortage/SPOF analysis, assessment auto-grading) implemented with
**zero external dependencies** — no database, no HTTP, nothing. It's pure functions, unit-tested
with vitest. That's a deliberate choice so the "smart" part of the product is trivially testable
and portable.

### Multi-tenancy

Hierarchy: `Tenant → Organization → Division → Department → Team → User`. Every tenant-scoped
row carries `tenantId` (and usually `organizationId`). Isolation is enforced at the app layer via
`AsyncLocalStorage` (`packages/shared/tenant-context.ts`, `runWithTenant()`) — the tenant/org/
user/roles for a request are resolved once by middleware and threaded implicitly through every
service call for that request, so individual queries don't have to remember to filter by tenant
every time. The schema also carries hand-written Postgres Row-Level-Security policies
(`packages/database/prisma/sql/rls-and-audit.sql`) as a second layer of defense at the database
level, plus append-only triggers on the audit log table.

### Authentication & authorization

- **Auth today is app-native, not Keycloak**: email + bcrypt password hash, a signed JWT (12-hour
  expiry) issued on login, verified on every request by `TenantMiddleware`. Keycloak env vars
  exist and are referenced in comments as the intended path for federated/enterprise SSO, but
  nothing in the running code actually talks to a Keycloak server today — there's no live
  Keycloak instance. Social login (Google/Apple/Facebook/LinkedIn/Microsoft) *is* implemented and
  wired (`auth/social.controller.ts`), separate from the Keycloak question.
- **Two portals, one JWT**: a "learner" portal (everyone) and an "admin" portal, gated by an
  allowlist of role keys (`org_admin`, `dept_manager`, `compliance_manager`, `instructor`, etc.).
  An admin is also a learner; a pure learner is refused at the admin door.
- **RBAC**: 13 access roles with a fine-grained permission-string matrix (e.g. `catalog:manage`,
  `compliance:read`, `report:export`) defined in `packages/shared/rbac.ts`. Individual endpoints
  declare their required permission(s) via a `@RequirePermissions(...)` decorator, enforced by a
  `PermissionsGuard`. This is checked on essentially every controller method in the API (verified
  directly — see the endpoint list in §3).
- **Tenant resolution has already had one real security fix worth knowing about**: the
  middleware used to fall back to trusting client-supplied `X-Tenant-Id`/`X-Org-Id`/`X-Roles`
  headers when no valid JWT was present, which allowed unauthenticated cross-tenant data access —
  this was found, confirmed live, and closed (documented in the middleware's own code comments,
  dated 2026-07-21). There is now no anonymous-fallback path for anything except an explicit,
  narrow public allowlist (health check, login/signup, the public sales-inquiry endpoints, and
  provider webhooks, which authenticate themselves a different way — see §5). This is a strength
  worth mentioning to a partner doing due diligence: the team caught and fixed a real
  vulnerability rather than it being unnoticed.

### Notable design decisions

- **Provider Abstraction Layer (PAL)** — described in the code itself as "the integration moat":
  every external content provider (GO1, OpenSesame, Microsoft Learn, AWS Skill Builder, and
  planned Coursera/LinkedIn Learning/Udemy Business/Skillsoft/etc.) and every internal knowledge
  source (Confluence, SharePoint, Drive, M365, Notion) implements one `CourseProvider` interface.
  Nothing above that layer — catalog sync, enrollment, progress tracking, skills mapping — ever
  special-cases a vendor by name. This is the most relevant architectural fact for a GO1
  conversation; see §5.
- **Capabilities are declared, not assumed** — each provider connector states what it can
  actually do (`catalogSync`, `webhooks`, `certificates`, `ssoLaunch`, `scorm`, `xapi`, etc.) and
  the orchestrator routes around anything it can't.
- **"Declared seams"** — where real vendor integration work is blocked on something external
  (API docs, sandbox credentials), the code is written as a contract-complete stub with explicit
  `TODO` comments and dated status notes, rather than being faked or silently mocked. This makes
  it easy to tell, by reading the code, what's real vs. pending — see §6.
- **Event bus** — an in-process pub/sub abstraction (`common/events/event-bus.ts`) sits where a
  real message broker (RabbitMQ) is intended to go later, using the same interface either way, so
  modules already communicate in an event-driven style without actually requiring a broker to run
  today.

---

## 3. API Surface

**Format**: REST + JSON, NestJS conventions. Global prefix `/api/v1`. Requests are validated with
`class-validator` DTOs under a global `ValidationPipe({ whitelist: true, transform: true })` —
unknown fields are stripped, types are coerced/validated before a handler ever runs.

**Documentation**: **Interactive Swagger/OpenAPI docs already exist and are live** at
`/api/docs` (bearer-auth aware — you can authorize with a token and try real calls from the
browser). This is generated automatically from the NestJS decorators, so it stays in sync with
the code; nothing needs to be written by hand for a partner to explore the surface.

**Scale**: 24 modules, roughly 80 endpoints. Full breakdown:

| Module | Endpoints | Purpose |
|---|---|---|
| `auth` | login, signup, forgot/reset password, me | Core authentication |
| `auth/social` | provider list, OAuth start/callback | Social login (Google/Apple/FB/LinkedIn/MS) |
| `identity` | list/create users, assign roles | User & RBAC management |
| `skills` | user skills, skill-gap | Skills Graph queries |
| `workforce` | readiness, team dashboard, nudge | Manager-facing team intelligence |
| `recommendations` | list, generate, accept | Explainable AI recommendations |
| `compliance` | dashboard | Compliance status rollups |
| `certification` | expiring, per-user, expiry-sweep trigger | Certification tracking |
| `career` | create career plan | Career roadmap generation |
| `catalog` | list/get courses | Course catalog (authenticated) |
| `enrollment` | create, update progress, list per-user | Enrollment & progress |
| `assessments` | get, submit attempt | Quizzes/assessments |
| `providers` | list available, connections CRUD, trigger sync | Provider connection management |
| `providers/webhooks` | receive event | Inbound provider push events (public, self-authenticating) |
| `marketplace` | products, create order | Commerce |
| `notifications` | list, mark read, renewal campaign | In-app/email notifications |
| `reporting` | export by kind | CSV/JSON report exports |
| `ai` | chat, knowledge-academy ingest | RIYADA AI assistant + doc→course pipeline |
| `forums` | threads, replies, votes, pin, accept, course reviews, peer review | Course discussion + peer review |
| `gamification` | me, leaderboard | XP/levels/streaks |
| `instructor` | overview, create course/module, complete module | Native course authoring |
| `sales` | featured, public catalog, course detail, inquiry, pipeline, reindex | Public marketing site + sales CRM |
| `errors` | report (public), list (admin) | Error monitoring (added 2026-08-05/08-13) |
| `analytics` | pageview (public), summary (admin) | First-party site analytics (added 2026-08-10) |
| `jobs` | manual triggers for the 5 scheduled jobs | Admin-triggerable background jobs |
| `demo` / `health` | context, healthcheck | Bootstrap & liveness |

Every non-public endpoint requires a valid Bearer JWT and passes through the permission guard
described in §2; the exceptions (public by design, listed exactly in
`tenant.middleware.ts`) are: health check, login/signup/password-reset/me, the public sales
catalog and inquiry form, social-login callbacks, provider webhooks, error reporting, and
analytics pageview beacons.

---

## 4. Data Model

60 Prisma models. Grouped by area (see `packages/database/prisma/schema.prisma` for the literal
source of truth — it's well-commented and organized under these same section headers):

- **Tenancy & org hierarchy** — `Tenant`, `Organization`, `Division`, `Department`, `Team`,
  `TeamMembership`.
- **Identity & RBAC** — `User`, `Role`, `RoleAssignment`, `SocialIdentity`. `User` carries an
  optional `keycloakId` (federated identity, not currently in use — see §2) and an optional
  `passwordHash` (nullable for SSO-only accounts).
- **Skills Graph** — `Skill`, `SkillEdge` (prerequisite/related/broader/narrower relationships),
  `Competency`, `JobRole`, `RoleSkillRequirement`, `UserSkill`. This is the core "intelligence"
  data structure: skills a person has, skills a role requires, and the graph edges between
  skills that let the engine compute gaps and paths.
- **Providers & Catalog** — `ProviderConnection`, `ProviderLearnerLink`, `ProviderWebhookEvent`,
  `Course`, `CourseSkill`, `LearningPath`, `LearningPathItem`. **This is the group directly
  relevant to a GO1 integration — see §5 for exactly how it's used.**
- **Enrollment, progress, assessments** — `Enrollment`, `Invitation`, `Assessment`, `Question`,
  `AssessmentAttempt`.
- **Certification intelligence** — `Certification`, `CertificationSkill`, `EarnedCertificate`.
- **Compliance intelligence** — `ComplianceFramework`, `ComplianceControl` (maps to required
  courses/certs), `ComplianceAssignment` (per-user status: compliant/due/at_risk).
- **Career intelligence** — `CareerPath`, `CareerPlan` (computed skill gap + roadmap + cost/time
  estimate).
- **AI recommendations** — `Recommendation` (kind, subject, a human-readable `reason` string —
  explainability is a stated product requirement, not an afterthought).
- **Commerce** — `Product`, `Subscription`, `Order`, `OrderItem`, `Payment`.
- **Platform** — `Notification`, `Nudge`, `AuditLog` (append-only, DB-trigger enforced),
  `ErrorLog`, `PageView`.
- **Activity & gamification** — `ActivityEvent`, `XpEvent`, `Badge`, `EarnedBadge`.
- **Community** — `ForumThread`, `ForumReply`, `ForumVote`, `PeerReview`, `CourseReview`.
- **Native authoring** — `CourseModule`, `ModuleProgress` (sequential-unlock lesson content
  authored directly in RiyadaIntel, as opposed to synced from a provider).
- **Sales site** — `Promotion`, `Inquiry` (the public "book a demo"/"claim my discount" form
  submissions — CRM deal seed).

### Where GO1 data would land

- `ProviderConnection` — one row per tenant's connection to GO1; credentials stored encrypted at
  rest (`credentialsEnc`, via `provider-credentials.ts` / `CREDENTIALS_ENC_KEY`).
- `Course.providerKey="go1"` + `externalId` (GO1's own course ID) + `connectionId` — synced GO1
  courses land here. Unique on `(providerKey, externalId, tenantId)`, so re-running a sync
  upserts rather than duplicates.
- `CourseSkill` — GO1's own topic/skill tags, if it has them, get reconciled automatically into
  the canonical `Skill` graph during sync (new skill names are created on first sighting, matched
  by name thereafter).
- `ProviderLearnerLink` — a stable, one-time mapping from a RiyadaIntel `User` to their GO1
  learner ID, created on first enrollment and reused for every subsequent enroll/progress/
  certificate call, so GO1 isn't asked to re-create the same learner repeatedly.
- `Enrollment.externalEnrollmentId` + `lastSyncedAt` — tracks GO1's enrollment ID and when
  progress was last pulled/pushed, so a polling job knows what's stale and a webhook push can be
  deduplicated against it.
- `ProviderWebhookEvent` — a durable, append-only inbox for anything GO1 pushes at us, stored
  before any attempt to interpret it (see §5 for why).

---

## 5. Integration Readiness

### What's already built

- **A real, generic integration contract** (`CourseProvider` interface, `packages/providers`):
  catalog listing + incremental sync, learner creation, enrollment, progress polling,
  certificate retrieval, SSO/LTI launch URL generation, and skill-metadata extraction — one
  interface every provider implements, with per-provider capability flags so the platform never
  assumes something a given provider can't actually do.
- **A GO1 connector already scaffolded and registered** (`providers/go1.provider.ts`) — this is
  explicitly written as the reference implementation/template for every other connector. What's
  real in it today: OAuth2 client-credentials token acquisition and caching, the full method
  signature surface, capability declarations, and a health-check. What's stubbed: every actual
  HTTP call to a GO1 endpoint (listed below).
- **Admin UI + API to connect a provider and run a sync** — an admin enters credentials
  (encrypted at rest before storage), and can trigger a catalog sync that upserts courses and
  reconciles skill tags into the canonical Skills Graph in one pass. This runs inline today
  (synchronous, for demonstrability); the code is structured so it can be moved to a background
  worker without changing the interface.
- **An inbound webhook receiver**, generic and provider-agnostic
  (`providers/provider-webhooks.controller.ts`), already deployed and reachable at
  `POST /api/v1/providers/webhooks/:providerKey/:connectionId`. It authenticates the connection
  by ID (not a user JWT, since GO1 could never present one of ours), verifies an HMAC signature
  when a per-connection webhook secret is configured, and **durably stores every raw event before
  attempting to interpret it** — so nothing is lost or silently dropped while the real payload
  shape is still unknown.
- **A polling fallback/backstop** (`jobs/jobs.service.ts` → `providerProgressPoll()`) that walks
  active connections and enrollments and pulls progress via the same `CourseProvider` interface.
  It's off by default (`PROVIDER_POLLING_ENABLED` must be exactly `"true"`) specifically so it
  doesn't hit a real GO1 connection with unconfirmed request volume/rate limits before that's
  settled — but the logic is real and ready to enable.
- **Credential encryption at rest** for any provider's stored API keys/secrets.

### What's NOT yet built — and why

Every concrete HTTP call in the GO1 connector is a `TODO` stub returning empty/placeholder data
(`listCourses` returns an empty page, `enrollLearner` returns a fake "stub" enrollment ID, etc.).
This isn't unfinished work in the ordinary sense — it's explicitly blocked on **not yet having
GO1's API documentation or sandbox credentials**, which the code comments date to 2026-08-03 and
attribute to "waiting on Luke Barnes at GO1." Specifically unconfirmed and therefore unbuilt:

- The real base URL and OAuth token endpoint (currently a documented-public-host guess:
  `api.go1.com`).
- Whether GO1 pushes completions via webhook, expects polling, or supports both — both code paths
  exist and are ready, but neither is wired to real GO1 semantics yet.
- GO1's webhook signature scheme (header name, HMAC algorithm) — the receiver checks two common
  conventions as placeholders pending confirmation.
- GO1's actual request/response payload shapes for courses, learners, enrollments, progress, and
  certificates — everything that would need mapping into the canonical `CanonicalCourse`/
  `Enrollment`/`Progress`/`CanonicalCertificate` shapes.
- SSO/LTI deep-link generation into GO1 (`getLaunchUrl`) is currently a no-op passthrough.

### Net assessment

The **platform-side** integration work — data model, sync orchestration, skill reconciliation,
admin connection UI, webhook receiver, polling backstop, credential storage — is done and does
not need to change to onboard GO1. The **remaining work is entirely GO1-specific**: once real API
docs and sandbox credentials exist, it's filling in roughly ten `TODO`-marked HTTP calls in one
file (`go1.provider.ts`) plus confirming the webhook payload shape in one other file
(`provider-webhooks.controller.ts`). The blocker is external (GO1's documentation/access), not
architectural.

---

## 6. Current State / Known Limitations

**Fully built and verified** (real code, tested, runs against the live database):

- The intelligence engines (skill-gap, compliance, certification-expiry, career roadmap,
  recommendation ranking, workforce planning, assessment auto-grading) — framework-free, unit
  tested.
- The full 60-model data schema, plus Postgres RLS policies and append-only audit triggers.
- RBAC + tenant isolation, including a real vulnerability that was found and fixed (§2).
- The learner/manager/admin product surface itself (dashboards, catalog, compliance, career,
  certifications, forums, gamification, instructor authoring, marketplace, reporting).
- The public marketing/sales site, with working lead-capture forms that store to the database and
  email the sales inbox.
- Error monitoring (backend + frontend error capture with email alerting) and first-party,
  cookieless pageview analytics — both added this month (2026-08-05 and 2026-08-10
  respectively).

**Real code, partially wired** (the logic is genuinely implemented, not faked, but depends on
something not yet connected):

- **Provider connectors** — this applies to all four Phase-1 connectors (GO1, OpenSesame,
  Microsoft Learn, AWS Skill Builder), not just GO1: the interface, registry, sync orchestration,
  and admin UI are real; the actual vendor HTTP calls are stubs pending each vendor's API access.
- **Background jobs** (cert-expiry sweep, compliance recompute, catalog sync, learner nudges,
  provider progress poll) run for real today, but on in-process JS timers (`setInterval`), not a
  message queue — RabbitMQ is referenced throughout as the intended transport but isn't running
  in production.
- **Report exports** — CSV and JSON are real; PDF/Excel/PowerBI are unimplemented serializers
  over the same underlying data.
- **Payment capture** — `Order`/`Payment` records and the checkout flow are real; actual Stripe
  PaymentIntent capture is a stub in `marketplace.service.ts`.
- **AI Knowledge Academy** (turn an uploaded document into a course) — the ingestion pipeline and
  chat interface are wired to a real LLM (Claude by default); this was not re-verified in depth
  for this document and is worth a closer look if it's going to be demoed externally.

**Referenced in config but not running in production today**: Redis, RabbitMQ, ClickHouse,
Keycloak. All four have environment variables defined and appear in `docker-compose`, and the
code has interfaces shaped around eventually using them (an outbox-pattern event bus for
RabbitMQ, an xAPI/event-scale analytics store meant to be ClickHouse, federated SSO meant to be
Keycloak). None of the four containers are actually up on the production box right now — only
Postgres and Meilisearch are. This is architecture built ahead of the infrastructure that would
back it, which is a reasonable and common sequencing choice at this stage, but it means anything
described in the docs as depending on those services is not live yet.

**Not started**: SCORM player, LTI 1.3, native mobile apps — these are roadmapped only, no code
exists yet.

**Infrastructure/operational flags worth naming honestly**:

- **Single-server deployment** — Postgres, Meilisearch, and both PM2-managed apps all run on one
  VPS with no redundancy or auto-scaling. Fine for the current stage; a real constraint to plan
  around before a large customer or GO1-scale data volume shows up.
- **SSH hardening gap** — separately verified this session: the server currently allows root
  login with password authentication, open to the whole internet, with no per-person SSH key
  provisioned for anyone on the team yet. Not related to the application code, but worth the
  CTO's attention alongside this document.
- **Repo docs drift from code** — `CLAUDE.md` and `BUILD.md` in this repo are useful orientation
  reading but were found to be slightly stale during this review (e.g. they undercount the
  current number of API modules, and `CLAUDE.md` still describes a tenant-header trust fallback
  that was already removed for the security fix noted in §2). Everything in *this* document was
  checked against the running code directly rather than against those docs; it's worth doing the
  same in the future rather than trusting either doc at face value.

---

*This document was generated by reading the actual source code, running infrastructure, and
Prisma schema on 2026-08-13 — not from the design docs in `docs/`, though those remain useful
supplementary reading (`docs/01-system-architecture.md` and `docs/03-data-and-api.md`
especially). If anything here conflicts with `docs/`, `CLAUDE.md`, or `BUILD.md`, this document
and the code it was checked against should be treated as current.*
