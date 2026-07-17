# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

RiyadaIntel — an AI-powered workforce intelligence platform (not an LMS): it sits above
learning providers (GO1, OpenSesame, MS Learn, AWS Skill Builder, etc.) and internal
knowledge sources and answers skills-gap / compliance / certification / career questions.
The `docs/` dossier (`00`–`06`, read in that order) is the authoritative design spec —
`docs/01-system-architecture.md` and `docs/03-data-and-api.md` are the most useful for
orienting in the code. `docs/06-carl-feedback-action-plan-2026-07-13.md` tracks the current
build priorities (nudges, mobile UI, manager dashboard, gamification, forums, instructor
portal, public sales site) — check it before assuming what's next.

`BUILD.md` is the honest status board: what's real and tested vs. a "declared seam"
(interface in place, implementation deferred). Read it before assuming something is broken —
it may be an intentional stub (see Architecture below).

This repo is also what's actually running in production behind riyadaintel.com: pm2
(`ecosystem.config.js`) runs `riyada-api` (`apps/api/dist/main.js`, port 4400) and
`riyada-web` (`next start -p 3300` from `apps/web`), and Apache reverse-proxies `/api/` and
`/` to those ports respectively. After editing `apps/api` or `apps/web`, rebuild
(`pnpm --filter @riyada/api build` / `pnpm --filter @riyada/web build`) and `pm2 restart
riyada-api riyada-web` (or re-run `scripts/serve.sh`) for changes to go live. Default `pnpm
dev` ports (api :4000, web :3000, per `main.ts` / `apps/web/package.json`) are different from
the production pm2 ports (4400/3300) — don't confuse the two when checking "is it running."

## Commands

```bash
pnpm install                          # workspace install
pnpm dev                              # turbo: api (:4000) + web (:3000) in parallel
pnpm build                            # turbo run build (all packages + apps)
pnpm lint                             # turbo run lint
pnpm typecheck                        # turbo run typecheck
pnpm test                             # turbo run test (all packages, incl. vitest)
pnpm test:intelligence                # just the intelligence package (18 tests)
pnpm demo                             # tsx scripts/demo.ts — full gap→reco→compliance→cert→career loop

pnpm db:generate                      # prisma generate (@riyada/database)
pnpm db:migrate                       # prisma migrate dev
pnpm db:studio                        # prisma studio

docker compose up -d                  # postgres :5440, redis :6390, meilisearch :7700,
                                       # rabbitmq :5672/:15672, clickhouse :8123/:9000, keycloak :8080

bash scripts/serve.sh                 # production-style local run: builds if needed, backgrounds
                                       # api (:4400) + web (:3300) via nohup, prints demo curl commands
bash scripts/serve.sh stop            # stop those background processes
```

Single-package / single-test runs (packages are framework-free and use vitest):
```bash
pnpm --filter @riyada/intelligence test          # or: cd packages/intelligence && npx vitest run
npx vitest run <path/to/file.test.ts>             # one file
npx vitest run -t "<test name>"                   # one test by name
```

`apps/api/test/live-e2e.js` is a socket-free DI harness that boots the real Nest app
in-process against a live DB and drives the actual services end to end (skill-gap,
compliance, certification, recommendations, RBAC) — this is the reference for "does this
actually work," as opposed to unit-level mocks.

CI (`.github/workflows/ci.yml`) runs against a real Postgres service container: install →
`db:generate` → `typecheck` → `test` → `pnpm --filter @riyada/api build`. On `main`, it also
builds/pushes the API image from `infra/docker/api.Dockerfile`.

## Architecture

Monorepo: pnpm workspaces (`apps/*`, `packages/*`) + Turborepo. Path aliases in
`tsconfig.base.json` map `@riyada/{shared,intelligence,providers,database}` to each
package's `src`.

- **`packages/database`** — Prisma schema (`prisma/schema.prisma`, 30+ models) is the single
  source of truth for the data model. `prisma/sql/rls-and-audit.sql` adds per-tenant
  Row-Level Security policies and append-only audit triggers; apply it after
  `prisma migrate`.

- **`packages/providers`** — the Provider Abstraction Layer (PAL) and the integration moat.
  Every external provider (GO1, OpenSesame, MS Learn, AWS Skill Builder, ... Phase 2/3
  providers) and every internal source (SharePoint, Confluence, Drive, M365, Notion,
  AI-generated content) implements the single `CourseProvider` interface
  (`course-provider.interface.ts`); `registry.ts` maps a connector key to its factory.
  Nothing above the PAL ever special-cases a vendor. Adding a provider = "copy a connector,
  fill the TODOs, register it."

- **`packages/intelligence`** — the actual product logic (skill-gap analysis, career
  roadmaps, compliance scoring, certification expiry, explainable recommendations, the
  skill reconciler, workforce planning, assessment auto-grading). Framework-free, fully
  unit-tested with vitest, runs with no external services.

- **`packages/shared`** — cross-cutting RBAC (13 roles + permission matrix, `rbac.ts`),
  tenant context via `AsyncLocalStorage` (`tenant-context.ts`, `runWithTenant`), and domain
  errors.

- **`apps/api`** — NestJS modular monolith (one deploy, hard module boundaries — the
  intended path to extraction later, first candidates being AI, provider-sync workers,
  LRS/analytics ingest, reporting). Modules live under `src/modules/*`: identity, skills,
  workforce, recommendations, compliance, certification, career, catalog, enrollment, lms,
  assessments, providers, marketplace, notifications, reporting, ai, auth, forums,
  gamification, instructor, sales, demo. Rule: no module reaches into another module's
  tables directly — only through its service interface or a domain event
  (`common/events/event-bus.ts`). Global API prefix is `api/v1`; Swagger UI at `/api/docs`.

  **Tenant/auth resolution** (`common/tenant/tenant.middleware.ts`) is the thing to read
  first when debugging anything cross-tenant or role-related: it verifies a Bearer JWT via
  `AuthService` and wraps the request in `runWithTenant`, but also has an intentional "demo
  fallback" that trusts `X-Tenant-Id` / `X-Org-Id` / `X-User-Id` / `X-Roles` headers directly
  when there's no valid JWT (so the public demo works without login). `scripts/serve.sh`'s
  printed curl examples use exactly these headers. RBAC is enforced separately via
  `common/rbac/permissions.guard.ts` + the `@Permissions` decorator.

  **RIYADA AI** (`modules/ai`) is a provider-neutral LLM router: Anthropic (official SDK) is
  the default reasoning model, with OpenAI/Gemini/local reachable via HTTP adapters; it does
  grounded tool-calling and drives the "AI Knowledge Academy" doc→course generation pipeline.

  **Background jobs** (`src/jobs`) — expiry-sweep, compliance-risk-recompute, catalog-sync —
  run off an in-process event bus today; RabbitMQ is the intended transport behind it
  (outbox pattern) but is currently a declared seam, not fully wired.

- **`apps/web`** — Next.js 15 (App Router), RTL/i18n (`src/lib/i18n.ts`) and dark mode as
  first-class concerns. The `(app)` route group holds the authenticated product surface
  (learner, team, skills, compliance, certifications, career, catalog, marketplace, reports,
  notifications, people, providers, ai, instructor, assessment, sales-inquiries,
  my-learning); top-level routes handle login/signup/password-reset and the public
  marketing page. Pages are written to fall back to demo data when the API is offline.

### Declared seams — don't "fix" these without checking `BUILD.md` first

Some things look incomplete but are intentionally stubbed, with the interface already
correct: provider connector HTTP/OAuth calls (e.g. `go1.provider.ts` — contract-complete,
network calls are `TODO`), the RabbitMQ/Meilisearch/ClickHouse/S3 transports behind the
event bus, Stripe payment capture in `marketplace.service.ts`, PDF/Excel/PowerBI report
serializers (CSV/JSON are real), and SCORM/LTI/native-mobile.
