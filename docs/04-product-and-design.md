# RiyadaIntel — Product & Design (Part 5 of 6)

Covers deliverables **25 Folder Structure · 26 UI/UX Design System · 27 Wireframes · 28 User
Journeys.**

---

## 25. Folder Structure

Monorepo (pnpm + Turborepo). Full tree:

```
riyadaintel/
├── apps/
│   ├── web/                    # Next.js 15 (see apps/web/README.md)
│   │   └── src/{app,components,lib,locales}
│   └── api/                    # NestJS (see apps/api/README.md)
│       └── src/{common,modules,jobs}
├── packages/
│   ├── providers/             # Provider Abstraction Layer (CourseProvider + connectors)
│   ├── database/              # Prisma schema + client + migrations + seed
│   ├── intelligence/          # skills graph, gap/career/compliance/cert algorithms (pure libs)
│   ├── ai/                    # LLM router, RAG, tools, agent workflows
│   ├── ui/                    # ShadCN-based shared component library + tokens
│   ├── shared/                # types, RBAC permissions, tenant context, errors, zod schemas
│   └── config/                # eslint/tsconfig/tailwind presets
├── infra/
│   ├── terraform/             # vpc, eks/aks, aurora, redis, mq, clickhouse, s3, kms
│   ├── k8s/                   # helm charts / manifests, argo rollouts
│   └── docker/                # Dockerfiles per app
├── docs/                      # this dossier (deliverables 1–40)
├── .github/workflows/         # CI/CD
├── docker-compose.yml         # local deps
├── turbo.json · pnpm-workspace.yaml · package.json
```

Rationale: domain logic lives in framework-agnostic `packages/*` (testable, reusable by web,
api, and future mobile); apps are thin. `intelligence` and `ai` are deliberately separate from
`api` so the moat is portable and unit-tested in isolation.

## 26. UI/UX Design System

**Inspiration:** Apple (restraint, typography), Linear (speed, keyboard-first, density done
well), Stripe (trustworthy data presentation), Notion (flexible, calm). **Principles:** premium,
modern, elegant, minimal, enterprise-grade — *intelligence-forward* (lead with insight, not a
course grid).

- **Foundations:** design tokens (color, spacing, radius, typography, elevation) in
  `packages/ui`; **dark + light** mode; **English + Arabic with full RTL** (logical properties,
  mirrored layouts, Arabic-tuned type scale). WCAG 2.2 AA.
- **Signature components:** `RiskBadge` (green/amber/red), `MetricCard`, `TrendChart`,
  `SkillGapMeter`, `ComplianceHeatmap`, `CareerLadder`, `RecommendationCard` (always shows the
  *why*), `ExpiryTimeline`, `AssistantPanel` (RIYADA AI). Built on ShadCN + Radix; motion via
  Framer Motion (purposeful, subtle).
- **Dashboard kit:** every dashboard composes the same primitives, so Platform / Org /
  Compliance / Finance / Manager / Provider / Learner views are *configurations*, not rewrites.
- **Tone of data:** explainability everywhere — no number without a "why/drill-down"; AI output
  always labeled and cited.

## 27. Wireframes (low-fidelity)

**Learner — Home (intelligence-forward):**
```
┌───────────────────────────────────────────────────────────────┐
│ RiyadaIntel        Search…                      🌙  AR  ◯ Bert │
├──────────┬────────────────────────────────────────────────────┤
│ Home     │  Readiness 78%  ▮▮▮▮▮▮▮▯▯   ↑4 this month           │
│ Learning │  ┌─ Why you're here ───────────────────────────┐    │
│ Skills   │  │ ⚠ 2 certs expiring (ISO27001 in 22d)         │    │
│ Career   │  │ ● Gap: Terraform, SOC2 for your role        │    │
│ Certs    │  │ ◆ Assigned: GDPR refresh (compliance)       │    │
│ AI ◀──────  └──────────────────────────────────────────────┘    │
│          │  Recommended  [Why?]                               │
│          │  ┌─Azure Sec─┐ ┌─Terraform─┐ ┌─SOC2 Prep─┐         │
│          │  │ MS Learn  │ │ O'Reilly  │ │ Cybrary   │         │
│          │  └───────────┘ └───────────┘ └───────────┘         │
└──────────┴────────────────────────────────────────────────────┘
```

**Compliance dashboard (manager):**
```
┌ Compliance — Engineering Dept ───────────────── Audit-ready: 86% ┐
│ Framework   Status      At-risk  Due   Compliant                 │
│ ISO 27001   ▮▮▮▮▮▯  RED  3        5      42                       │
│ GDPR        ▮▮▮▮▮▮  AMBER 0       8      48                       │
│ SOC2        ▮▮▮▮▮▮  GREEN 0       1      55                       │
│ ── Team heatmap (people × controls) ── click a red cell → person │
│ [Auto-assign all red]   [Launch renewal campaign]                │
└──────────────────────────────────────────────────────────────────┘
```

**Career Studio:**
```
Current: Helpdesk Engineer  ──►  Target: [ Cloud Architect ▾ ]
Gap (6 skills): Networking, AWS, Terraform, IaC, Security, Architecture
Roadmap  ▣▣▣▣▣▣▣▣  ~9 months · ~$1,800
  1 AWS Cloud Practitioner (AWS SB)   2 Terraform Assoc (O'Reilly) …
[Start plan]   [Ask RIYADA AI to coach me]
```

## 28. User Journeys

- **Org Admin onboarding:** create org → set branding/domain/locale (en/ar) → connect providers
  (BYOL) → import users (SCIM/CSV) → map roles to job roles → seed compliance frameworks →
  *first value:* readiness + risk dashboard populated automatically.
- **Compliance Manager (wedge):** open dashboard → see red controls + expiring certs → "auto-
  assign all red" → launch renewal campaign → watch risk drop to green → export audit report.
- **Learner:** log in → home shows *why* (gaps, expiries, assignments) → accept a recommendation
  → launch course (SSO into provider) → complete → skills level up → readiness rises →
  next recommendation appears.
- **Employee career growth:** pick target role in Career Studio → get roadmap (time + cost) →
  RIYADA AI coaches → progress tracked against the plan.
- **L&D admin via AI Knowledge Academy:** upload policy PDF → AI generates course + assessment +
  competency map → review/approve → publish internally → flows through the same LMS + skills
  pipeline as any provider course.
- **Training provider/partner:** list catalog → appears in skills-aware marketplace → earns
  enrollments matched by gap analysis → revenue share.

→ Continue to `05-gtm-roadmap-build.md`.
