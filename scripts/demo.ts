/**
 * End-to-end demo of the RiyadaIntel intelligence loop on the seed dataset (the brief's
 * Cloud Security Engineer example). Runs the real engines from @riyada/intelligence — no DB, no
 * network — to prove gap analysis → recommendations → compliance → certification → career work
 * together. Run: npx tsx scripts/demo.ts
 */
import {
  analyzeSkillGap,
  recommendCourses,
  evaluateControl,
  rollupDepartmentRisk,
  certStatus,
  dueReminders,
  buildCareerPlan,
  type RoleRequirement,
  type UserSkill,
  type CourseLite,
  type Skill,
} from "../packages/intelligence/src/index";

const NOW = new Date("2026-06-07T00:00:00Z");

const skills: Skill[] = [
  { id: "linux", name: "Linux" },
  { id: "networking", name: "Networking", prerequisites: ["linux"] },
  { id: "aws-sec", name: "AWS Security", prerequisites: ["networking"] },
  { id: "azure-sec", name: "Azure Security" },
  { id: "terraform", name: "Terraform", prerequisites: ["aws-sec"] },
  { id: "iso27001", name: "ISO 27001" },
  { id: "soc2", name: "SOC2" },
  { id: "iam", name: "IAM" },
];

const roleReqs: RoleRequirement[] = [
  { skillId: "aws-sec", targetLevel: 4, importance: "required" },
  { skillId: "azure-sec", targetLevel: 3, importance: "required" },
  { skillId: "iso27001", targetLevel: 3, importance: "required" },
  { skillId: "iam", targetLevel: 4, importance: "required" },
  { skillId: "terraform", targetLevel: 3, importance: "required" },
  { skillId: "soc2", targetLevel: 3, importance: "required" },
];

const amirSkills: UserSkill[] = [
  { skillId: "aws-sec", level: 4 },
  { skillId: "iam", level: 4 },
];

const catalog: CourseLite[] = [
  { id: "c-azure", title: "Azure Security Engineer", providerKey: "ms-learn", rating: 4.6, durationMinutes: 600, priceCents: 0, skills: [{ skillId: "azure-sec", confidence: 0.9 }] },
  { id: "c-tf", title: "Terraform on AWS", providerKey: "aws", rating: 4.5, durationMinutes: 480, priceCents: 4000, skills: [{ skillId: "terraform", confidence: 0.9 }] },
  { id: "c-soc2", title: "SOC2 Readiness", providerKey: "cybrary", rating: 4.2, durationMinutes: 300, priceCents: 2000, skills: [{ skillId: "soc2", confidence: 0.85 }] },
  { id: "c-iso", title: "ISO 27001 Foundations", providerKey: "go1", rating: 4.4, durationMinutes: 360, priceCents: 1500, skills: [{ skillId: "iso27001", confidence: 0.9 }] },
];

function h(s: string) { console.log(`\n\x1b[1m${s}\x1b[0m`); }

// 1) SKILLS — gap analysis
h("1. SKILL GAP — Amir → Cloud Security Engineer");
const { gaps, coverage } = analyzeSkillGap(roleReqs, amirSkills);
console.log(`   coverage ${Math.round(coverage * 100)}% of required skills`);
console.log(`   missing: ${gaps.map((g) => g.skillId).join(", ")}`);

// 2) RECOMMENDATIONS — explainable
h("2. RECOMMENDATIONS (explainable)");
for (const r of recommendCourses(gaps, catalog, { costSensitive: true })) {
  console.log(`   • ${r.title} [${r.providerKey}]  — ${r.reason}`);
}

// 3) COMPLIANCE — green/amber/red
h("3. COMPLIANCE — ISO 27001 A.6.3 + GDPR Art.39 for Amir");
const evals = [
  evaluateControl({
    controlId: "ISO:A.6.3", requiredCourseIds: ["c-iso"], requiredCertificationIds: ["iso-la"],
    completedCourseIds: new Set(), certStatus: new Map([["iso-la", certStatus({ expiresAt: new Date("2026-06-29"), now: NOW })]]),
    dueAt: new Date("2026-05-01"), now: NOW,
  }),
  evaluateControl({
    controlId: "GDPR:Art.39", requiredCourseIds: ["c-gdpr"], requiredCertificationIds: [],
    completedCourseIds: new Set(), certStatus: new Map(), now: NOW,
  }),
];
for (const e of evals) console.log(`   ${e.status.toUpperCase().padEnd(5)} ${e.controlId} — ${e.reason}`);
const dept = rollupDepartmentRisk(evals);
console.log(`   department: ${dept.status.toUpperCase()}, audit-readiness ${dept.auditReadiness}%`);

// 4) CERTIFICATION — expiry + reminders
h("4. CERTIFICATION — ISO 27001 Lead Auditor");
const expires = new Date("2026-06-29T00:00:00Z");
console.log(`   status: ${certStatus({ expiresAt: expires, now: NOW })}`);
console.log(`   reminders due now (days before expiry): ${dueReminders(expires, NOW).join(", ")}`);

// 5) CAREER — roadmap with prerequisites, time, cost
h("5. CAREER PLAN — Helpdesk → Cloud Security Engineer");
const plan = buildCareerPlan({ targetRoleId: "cloud-sec", targetRequirements: roleReqs, userSkills: amirSkills, skills, catalog });
plan.steps.forEach((s) => console.log(`   ${s.order}. ${s.courseTitle} [${s.providerKey}] (${s.skillId})`));
console.log(`   estimate: ~${plan.estMonths} months · $${(plan.estCostCents / 100).toFixed(0)}`);

h("Workforce intelligence loop complete ✓");
