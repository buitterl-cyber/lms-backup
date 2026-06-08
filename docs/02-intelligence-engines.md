# RiyadaIntel — Intelligence Engines (Part 3 of 6)

Covers deliverables **10 Skills Intelligence · 11 Career Intelligence · 12 Compliance
Intelligence · 13 Certification Intelligence · 14 AI Architecture.** This is the moat.

---

## 10. Skills Intelligence Architecture

**The Skills Graph** is a property graph stored relationally (`Skill`, `SkillEdge`,
`Competency`, `JobRole`, `RoleSkillRequirement`, `UserSkill`, `CourseSkill`,
`CertificationSkill`). Edges: `prerequisite`, `related`, `broader/narrower`, weighted. The
canonical taxonomy is seeded from an open standard (ESCO / O*NET / Lightcast) via
`Skill.externalRef`, then extended per tenant.

**Skill resolution / reconciliation** (the hard, valuable part): every provider tags courses
differently. The reconciler maps raw provider tags → canonical skills in three tiers:
1. exact/alias string match,
2. embedding similarity (vector match against canonical skill embeddings),
3. low-confidence → human-review queue (and confidence stored on `CourseSkill.confidence`).
This mapping data compounds across tenants — the **data network effect**.

**Skill inference** of a *person's* skills from signals: completed enrollments (course→skills),
earned certificates (cert→skills), assessment scores, manager attestations, self-rating. Each
`UserSkill` carries `level` (1–5) + `source` + `evidence` for explainability.

**Gap analysis** (the canonical example from the brief):

```
Role: Cloud Security Engineer
Required: AWS Security, Azure Security, ISO27001, NIS2, IAM, Terraform, Python, SOC2
Employee has: AWS Security, IAM
Gap = Required − Has = { Azure Security, Terraform, SOC2, ISO27001, NIS2, Python }
→ for each gap skill, query CourseSkill for courses that teach it, rank by provider quality,
  level fit, duration, cost → recommend (e.g. Microsoft Learn, AWS Skill Builder, O'Reilly,
  Cybrary). Persist as Recommendation rows with a human-readable `reason`.
```

Gap analysis runs as a job on `skills.profile.changed` / `role` change, so dashboards show
current gaps without on-request computation.

## 11. Career Intelligence Architecture

Employee selects **current role** and **target role** (e.g. *Helpdesk Engineer → Cloud
Architect*, *Security Analyst → CISO*). The engine:
1. computes the **skill gap** between `RoleSkillRequirement(target)` and the user's `UserSkill`s;
2. pulls **certification requirements** for the target (via `CertificationSkill` / role mapping);
3. builds an **ordered roadmap** by traversing `SkillEdge` prerequisites (learn foundations
   before advanced) and fulfilling each gap skill with the best course/path;
4. estimates **completion time** (sum of course durations + pacing) and **investment** (sum of
   course/cert costs from marketplace pricing);
5. persists a `CareerPlan` (gap skills, roadmap JSON, estMonths, estCost).

`CareerPath` rows capture known role-to-role transitions (with `difficulty`, `typicalMonths`)
so the system can also *suggest* target roles ("people in your role commonly move to…"). RIYADA
AI provides conversational **career coaching** grounded in the user's plan.

## 12. Compliance Intelligence Architecture

Frameworks supported day one: **ISO 27001, ISO 9001, ISO 14001, ISO 45001, GDPR, NIS2, SOC2,
Cyber Essentials, HIPAA, PCI DSS, CIS Controls.** Modeled as `ComplianceFramework` →
`ComplianceControl` → required courses/certs. A control is *satisfied* for a user when the
required training is completed and required certs are valid.

**Risk scoring (Green / Amber / Red)** per `ComplianceAssignment`:
- **Green (compliant):** all required training complete, certs valid.
- **Amber (due):** training incomplete but not overdue, or cert within renewal window.
- **Red (at risk):** overdue training or expired/missing cert.

Recomputed on a schedule and on relevant events (`enrollment.completed`, `certificate.earned`,
`certification.expiring`). The **compliance dashboard** rolls up by department/team:
compliance status, missing training, expired certifications, **department risk scores**, audit
readiness, regulatory gaps — with drill-down to the person + the exact control. Auto-assignment:
a red control auto-creates an enrollment recommendation (and, if policy allows, auto-enrolls).

## 13. Certification Intelligence Architecture

`Certification` (validity window, CPD required) + `EarnedCertificate` (issuedAt, expiresAt,
cpdHours, status). A scheduled **expiry sweep** (indexed on `expiresAt`) transitions certs
`valid → expiring → expired` and emits `certification.expiring`. That drives:
- **automated reminders** (configurable lead times: 90/60/30/7 days),
- **escalations** to managers/compliance when ignored,
- **renewal campaigns** (bulk, by cohort) via notifications,
- **compliance alerts** when an expiry breaks a control.

Tracks **CPD/continuing-education hours** (fed from provider `cpdHours` and manual entry) and
accreditations, so a professional's renewal requirements are always current. This is the
sharpest **wedge feature** — expiries are hard deadlines with audit consequences, an easy first
sale.

## 14. AI Architecture — "RIYADA AI"

A multi-capability assistant, not a chatbot bolt-on. Capabilities: personal tutor, learning
coach, compliance advisor, certification advisor, career coach, workforce planner, skills
analyst, policy explainer, assessment generator, learning-path generator.

**Components:**
- **LLM Router** — provider-neutral abstraction over **Anthropic, OpenAI, Gemini, and local
  models**. Routes by task (cost/latency/quality): cheap/fast model for classification &
  tagging, strong model (Claude) for reasoning/coaching/generation, local models for sensitive
  gov tenants requiring on-prem inference. Per-tenant model policy + data-residency honored.
- **RAG** — retrieval over the org's ingested knowledge (AI Knowledge Academy documents) and
  the catalog, with a vector store; citations required.
- **Knowledge Graph grounding** — the Skills Graph is a first-class tool: the assistant calls
  graph queries (gap, prerequisites, role requirements) rather than hallucinating skills.
- **Tool calling** — the assistant has typed tools: `getSkillGap(userId)`, `recommendCourses
  (skillIds)`, `generateAssessment(courseId)`, `getComplianceStatus(deptId)`, `buildCareerPlan
  (userId,targetRole)`, `explainPolicy(docId)`. Every answer is **grounded + explainable**.
- **Multi-agent workflows** — e.g. *AI Knowledge Academy*: ingest agent → outline agent →
  lesson-writer agent → assessment-writer agent → skills-tagger agent → reviewer agent produce
  a course + lessons + assessment + competency map from a policy/SOP/PDF.

**Explainability & safety:** every recommendation/assignment stores a human-readable `reason`;
AI-generated content is flagged (`aiGenerated`, `Course.isInternal`); a human-in-the-loop review
gate precedes publishing generated courses or auto-assigning at scale. Cost controls: token
budgets per tenant, caching, model routing.

**AI Knowledge Academy pipeline:** upload (policies/PDFs/SOPs/procedures/KB) →
`document.ingested` → chunk + embed → generate **courses, lessons, assessments, certifications,
learning paths, competency maps** → human review → publish as internal `Course`s that flow
through the *same* LMS + skills pipeline as any provider course.

→ Continue to `03-data-and-api.md`.
