# @riyada/api — NestJS backend

Modular monolith that can split into services later (see docs/01 "Service Architecture").
Each domain is a Nest module; the gateway wires auth, tenant context, and RBAC guards.

```
apps/api/src/
├── main.ts                     # bootstrap, helmet, CORS, global pipes/guards
├── app.module.ts
├── common/
│   ├── tenant/                 # TenantContext middleware + AsyncLocalStorage
│   ├── rbac/                   # RolesGuard, @Permissions() decorator
│   ├── audit/                  # AuditInterceptor -> AuditLog (append-only)
│   └── observability/          # OTel tracing, request logging
├── modules/
│   ├── identity/               # users, orgs, divisions, departments, teams, RBAC
│   ├── providers/              # wraps @riyada/providers; connection mgmt, sync orchestrator
│   ├── catalog/                # courses, learning paths, search indexing (Meilisearch)
│   ├── lms/                    # enrollment, progress, SCORM/xAPI ingest -> LRS (ClickHouse)
│   ├── assessments/            # question banks, attempts, grading (auto + AI)
│   ├── skills/                 # Skills Graph, gap analysis  (uses @riyada/intelligence)
│   ├── career/                 # career path + plan generation
│   ├── compliance/             # frameworks, controls, risk scoring (green/amber/red)
│   ├── certification/          # earned certs, expiry/renewal sweeps, CPD
│   ├── ai/                     # RIYADA AI: LLM router, RAG, tool-calling, agents
│   ├── recommendations/        # recommendation engine + auto-assignment
│   ├── marketplace/            # products, subscriptions, orders, payments
│   ├── reporting/              # PDF/Excel/CSV/PowerBI exports
│   └── notifications/          # in-app/email/push + renewal campaigns
└── jobs/                       # RabbitMQ consumers: catalogSync, expirySweep, riskRecompute
```

The provider sync orchestrator, the compliance risk recompute, and the certification expiry
sweep are scheduled jobs (RabbitMQ + a cron producer), so the API stays request-fast while the
intelligence layer recomputes in the background.
