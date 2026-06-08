# RiyadaIntel — Data & API (Part 4 of 6)

Covers deliverables **15 Data Architecture · 16 Database Schema · 17 Full ERD · 18 API
Specifications.** The authoritative schema is `packages/database/prisma/schema.prisma`.

---

## 15. Data Architecture

Polyglot persistence, each store for what it is best at:

| Store | Role |
|---|---|
| **PostgreSQL** (Aurora) | OLTP system of record; all entities below; **RLS** for tenant isolation |
| **ClickHouse** | analytics + **xAPI Learning Record Store**; raw activity/event scale (billions of statements), powers engagement/skill-growth dashboards |
| **Redis** | cache, rate-limit counters, distributed locks (sync jobs), session-ish ephemera |
| **Meilisearch** | catalog & skills search (typo-tolerant, faceted, instant) |
| **S3 / R2** | content, SCORM packages, certificates, uploads, generated course assets |
| **Vector store** (pgvector or dedicated) | embeddings for skills reconciliation + RAG |

**Data principles:** every tenant-scoped row carries `tenantId` + `organizationId`; OLTP holds
*current state*, ClickHouse holds *event history*; the intelligence layer reads precomputed
state (gap/risk/reco materialized by jobs); PII minimized, encrypted, region-pinned, retained
per policy. CQRS-lite: writes to Postgres, heavy reads/aggregations from ClickHouse + cached
read models.

## 16. Database Schema

Full Prisma schema in `packages/database/prisma/schema.prisma`. Entity groups:

- **Tenancy/org:** `Tenant, Organization, Division, Department, Team, TeamMembership`
- **Identity/RBAC:** `User, Role, RoleAssignment`
- **Skills Graph:** `Skill, SkillEdge, Competency, JobRole, RoleSkillRequirement, UserSkill`
- **Providers/catalog:** `ProviderConnection, Course, CourseSkill, LearningPath,
  LearningPathItem`
- **LMS/assessment:** `Enrollment, Assessment, Question, AssessmentAttempt`
- **Certification:** `Certification, CertificationSkill, EarnedCertificate`
- **Compliance:** `ComplianceFramework, ComplianceControl, ComplianceAssignment`
- **Career:** `CareerPath, CareerPlan`
- **AI:** `Recommendation`
- **Commerce:** `Product, Subscription, Order, OrderItem, Payment`
- **Platform:** `Notification, AuditLog (append-only)`

Key design choices: composite tenant uniqueness (`@@unique([providerKey, externalId,
tenantId])` on `Course`); `AuditLog` INSERT-only at the DB level; `EarnedCertificate.expiresAt`
indexed for the expiry sweep; `ComplianceAssignment.status` indexed for dashboard rollups;
global vs. tenant skills via nullable `Skill.tenantId`.

## 17. Full ERD

```
Tenant 1───* Organization 1───* Division 1───* Department 1───* Team 1───* TeamMembership *───1 User
                   │                                    │                                  │
                   ├───* Role 1───* RoleAssignment *────┘                                  │
                   └───* ProviderConnection 1───* Course                                   │
                                                   │  *                                     │
   JobRole 1───* RoleSkillRequirement *───1 Skill ─┤  CourseSkill *───1 Skill              │
      │  *                                  │      │                                        │
   CareerPath *──────┐                      │ 1    │ 1                                       │
      │ 1            │              UserSkill *────┴── User ───────────────────────────────┘
   CareerPlan *──1 User                      (user owns:)
                                              ├── Enrollment *───1 Course
                                              │       └───* AssessmentAttempt *───1 Assessment 1───* Question
                                              ├── EarnedCertificate *───1 Certification *───* CertificationSkill ───1 Skill
                                              ├── ComplianceAssignment *───1 ComplianceControl *───1 ComplianceFramework
                                              ├── Recommendation
                                              ├── Notification
                                              └── AuditLog (actor)

LearningPath 1───* LearningPathItem *───1 Course
Skill 1───* SkillEdge *───1 Skill   (self-referential graph: prerequisite/related/broader/narrower)
Order 1───* OrderItem *───1 Product ;  Order 1───* Payment ;  Subscription *───1 Organization
```

Cardinality summary: a User has many Enrollments/Certificates/ComplianceAssignments/
Recommendations; a Course has many CourseSkills and Enrollments; a Skill participates in
User/Course/Role/Certification edges and in the self-referential `SkillEdge` graph; everything
roots at Tenant → Organization.

## 18. API Specifications

REST (OpenAPI 3.1) for CRUD + GraphQL gateway for rich dashboard reads; all under
`/api/v1`, OIDC bearer auth, `X-Tenant` resolved from token + host. Conventions: cursor
pagination, idempotency keys on mutations, RFC-7807 problem+json errors, RBAC per endpoint,
everything tenant-scoped server-side.

**Representative endpoints (not exhaustive):**

```
# Identity & org
POST   /api/v1/orgs/{orgId}/users                 invite/create user
POST   /api/v1/users/{id}/roles                   assign RBAC role (scoped)

# Providers & catalog
POST   /api/v1/providers/connections              connect a provider (encrypted creds)
POST   /api/v1/providers/connections/{id}/sync    trigger catalog sync (-> event)
GET    /api/v1/catalog/courses?q=&skill=&provider=&cursor=   search (Meili-backed)
GET    /api/v1/catalog/courses/{id}

# LMS
POST   /api/v1/enrollments                        enroll (idempotency-key)   {userId,courseId}
GET    /api/v1/users/{id}/enrollments
POST   /api/v1/xapi/statements                    LRS ingest (xAPI) -> ClickHouse
POST   /api/v1/scorm/{enrollmentId}/commit        SCORM runtime commit

# Skills & career intelligence
GET    /api/v1/users/{id}/skills                  inferred skill profile (+evidence)
GET    /api/v1/users/{id}/skill-gap?roleId=       gap analysis (explainable)
POST   /api/v1/users/{id}/career-plan             {targetRoleId} -> roadmap/estMonths/estCost

# Compliance & certification intelligence
GET    /api/v1/compliance/dashboard?deptId=       green/amber/red rollup + risk scores
GET    /api/v1/compliance/controls/{id}/gaps
GET    /api/v1/certifications/expiring?within=90d
POST   /api/v1/certifications/{id}/renewal-campaign

# AI (RIYADA AI)
POST   /api/v1/ai/chat                            grounded assistant (tool-calling, citations)
POST   /api/v1/ai/assessments/generate            {courseId} -> questions
POST   /api/v1/ai/knowledge-academy/ingest        upload doc -> course-generation pipeline

# Recommendations & marketplace
GET    /api/v1/users/{id}/recommendations         with `reason` (why)
POST   /api/v1/recommendations/{id}/accept
GET    /api/v1/marketplace/products?kind=&q=
POST   /api/v1/orders                             checkout

# Standards: LTI 1.3 launch, certificates, reporting
POST   /api/v1/lti/launch
GET    /api/v1/reports/{kind}?format=pdf|xlsx|csv  (kind: learning|compliance|skills|cert|revenue|readiness)
```

**Webhooks (inbound from providers):** `POST /api/v1/webhooks/providers/{key}` → normalized →
`enrollment.completed` / progress events. **Outbound webhooks** let customers subscribe to
`certification.expiring`, `compliance.risk.recomputed`, etc.

→ Continue to `04-product-and-design.md`.
