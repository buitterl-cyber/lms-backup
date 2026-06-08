# RiyadaIntel — AI-Powered Workforce Intelligence Platform

> "The AI-Powered Workforce Intelligence Platform that connects skills, compliance,
> certifications, careers, and learning from every major training provider into a
> single intelligence layer."

**RiyadaIntel is not an LMS.** It is a workforce *intelligence* layer that sits on top of
every major training provider (GO1, OpenSesame, Microsoft Learn, AWS Skill Builder,
Coursera, LinkedIn Learning, Udemy, Skillsoft, O'Reilly, and your own internal knowledge)
and answers the questions an LMS can't:

- Who needs training?
- What training do they need, and *why*?
- What skills are missing?
- Which certifications are expiring?
- What compliance risk exists right now?
- What career path should each person follow?
- What should be assigned automatically — today?

The **content is not the moat. The intelligence layer is the moat.**

---

## Repository layout

This is a monorepo (pnpm workspaces + Turborepo). Code and the full design dossier live
side by side so strategy and implementation never drift.

```
Learn/
├── docs/                      # The 40-deliverable design dossier (start here)
│   ├── 00-executive-summary.md      (Deliverables 1–6: vision, business, market, positioning)
│   ├── 01-system-architecture.md    (Deliverables 7–9, 19–24: services, events, infra, k8s, ci/cd)
│   ├── 02-intelligence-engines.md   (Deliverables 10–14: skills, career, compliance, cert, AI)
│   ├── 03-data-and-api.md           (Deliverables 15–18: data arch, schema, ERD, APIs)
│   ├── 04-product-and-design.md     (Deliverables 25–28: folders, design system, wireframes, journeys)
│   └── 05-gtm-roadmap-build.md      (Deliverables 29–40: pricing, marketplace, roadmap, budget, build plans)
│
├── packages/
│   ├── providers/             # Provider Abstraction Layer — the universal CourseProvider interface
│   ├── database/              # Prisma schema (single source of truth for the data model)
│   ├── intelligence/          # Skills graph, gap analysis, career & compliance engines (lib)
│   └── shared/                # Cross-cutting types, RBAC, tenant context, errors
│
├── apps/
│   ├── api/                   # NestJS modular backend (gateway + domain modules)
│   └── web/                   # Next.js 15 frontend (App Router, RTL/i18n, dark mode)
│
├── infra/                     # Terraform + Kubernetes manifests + Helm
├── package.json               # Workspace root
├── pnpm-workspace.yaml
└── turbo.json
```

## Where to start

1. **Read `docs/00-executive-summary.md`** — the why, the market, the business model.
2. **Read `docs/01-system-architecture.md`** — how the whole thing fits together.
3. **Read `docs/03-data-and-api.md`** + `packages/database/prisma/schema.prisma` — the data model.
4. **Read `packages/providers/src/course-provider.interface.ts`** — the integration moat.
5. **Read `docs/05-gtm-roadmap-build.md`** — the MVP build plan and how to phase the work.

## Tech stack (summary)

| Layer        | Choice                                                        |
|--------------|--------------------------------------------------------------|
| Frontend     | Next.js 15, React, TypeScript, Tailwind, ShadCN, Framer Motion |
| Backend      | NestJS, TypeScript                                            |
| Database     | PostgreSQL + Prisma (OLTP), ClickHouse (analytics/xAPI LRS)   |
| Cache/Queue  | Redis, RabbitMQ                                               |
| Search       | Meilisearch                                                   |
| Storage      | AWS S3 / Cloudflare R2                                        |
| Auth         | Keycloak (OIDC, SSO, MFA)                                     |
| AI           | LLM router across Anthropic / OpenAI / Gemini / local; RAG + Skills Graph |
| Infra        | Docker, Kubernetes, Terraform, GitHub Actions, AWS + Azure   |

## Status

This repository is the **founding design + scaffold**. The `docs/` dossier is complete and
authoritative; the code packages contain the production-shaped skeletons that the MVP build
plan (`docs/05`) turns into a running system. See that document for the phased plan.

## Quickstart (once the MVP modules are filled in)

```bash
pnpm install
pnpm db:generate            # prisma generate
docker compose up -d        # postgres, redis, meilisearch, rabbitmq, keycloak, clickhouse
pnpm db:migrate
pnpm dev                    # turbo runs api + web
```
