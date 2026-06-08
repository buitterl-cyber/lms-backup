import { describe, it, expect } from "vitest";
import {
  analyzeSkillGap,
  recommendCourses,
  evaluateControl,
  rollupDepartmentRisk,
  certStatus,
  dueReminders,
  buildCareerPlan,
  reconcileSkill,
  orderByPrerequisites,
} from "../src/index";
import type { RoleRequirement, UserSkill, CourseLite, Skill } from "../src/index";

describe("skill gap analysis (Cloud Security Engineer example from the brief)", () => {
  const required: RoleRequirement[] = [
    { skillId: "aws-sec", targetLevel: 4, importance: "required" },
    { skillId: "azure-sec", targetLevel: 3, importance: "required" },
    { skillId: "iso27001", targetLevel: 3, importance: "required" },
    { skillId: "iam", targetLevel: 4, importance: "required" },
    { skillId: "terraform", targetLevel: 3, importance: "required" },
    { skillId: "soc2", targetLevel: 3, importance: "required" },
  ];
  const have: UserSkill[] = [
    { skillId: "aws-sec", level: 4 },
    { skillId: "iam", level: 4 },
  ];

  it("identifies exactly the missing skills", () => {
    const { gaps, coverage } = analyzeSkillGap(required, have);
    const ids = gaps.map((g) => g.skillId).sort();
    expect(ids).toEqual(["azure-sec", "iso27001", "soc2", "terraform"]);
    expect(coverage).toBeCloseTo(2 / 6, 5);
  });

  it("orders required gaps by deficit", () => {
    const { gaps } = analyzeSkillGap(required, have);
    expect(gaps[0].deficit).toBeGreaterThanOrEqual(gaps[gaps.length - 1].deficit);
  });
});

describe("recommendations carry an explainable reason and cover gaps", () => {
  it("ranks the course that closes the biggest gaps first", () => {
    const gaps = analyzeSkillGap(
      [
        { skillId: "terraform", targetLevel: 3, importance: "required" },
        { skillId: "soc2", targetLevel: 3, importance: "required" },
      ],
      [],
    ).gaps;
    const catalog: CourseLite[] = [
      { id: "c1", title: "Terraform Deep Dive", providerKey: "oreilly", rating: 4.6,
        skills: [{ skillId: "terraform", confidence: 0.9 }] },
      { id: "c2", title: "SOC2 + Terraform Bootcamp", providerKey: "cybrary", rating: 4.2,
        skills: [{ skillId: "terraform", confidence: 0.8 }, { skillId: "soc2", confidence: 0.8 }] },
    ];
    const recs = recommendCourses(gaps, catalog);
    expect(recs[0].courseId).toBe("c2"); // covers two gaps
    expect(recs[0].reason).toMatch(/2 skill gaps/);
  });
});

describe("compliance green/amber/red", () => {
  const now = new Date("2026-06-07T00:00:00Z");
  it("red when a required cert is expired", () => {
    const e = evaluateControl({
      controlId: "A.6.3", requiredCourseIds: ["gdpr"], requiredCertificationIds: ["iso-la"],
      completedCourseIds: new Set(["gdpr"]),
      certStatus: new Map([["iso-la", "expired"]]), now,
    });
    expect(e.status).toBe("red");
  });
  it("amber when training outstanding but not overdue", () => {
    const e = evaluateControl({
      controlId: "A.6.3", requiredCourseIds: ["gdpr"], requiredCertificationIds: [],
      completedCourseIds: new Set(), certStatus: new Map(), now,
    });
    expect(e.status).toBe("amber");
  });
  it("green when everything satisfied", () => {
    const e = evaluateControl({
      controlId: "A.6.3", requiredCourseIds: ["gdpr"], requiredCertificationIds: ["iso-la"],
      completedCourseIds: new Set(["gdpr"]), certStatus: new Map([["iso-la", "valid"]]), now,
    });
    expect(e.status).toBe("green");
  });
  it("rolls up department audit readiness", () => {
    const r = rollupDepartmentRisk([
      { controlId: "1", status: "green", missingCourseIds: [], problemCertIds: [], reason: "" },
      { controlId: "2", status: "amber", missingCourseIds: [], problemCertIds: [], reason: "" },
      { controlId: "3", status: "red", missingCourseIds: [], problemCertIds: [], reason: "" },
    ]);
    expect(r.status).toBe("red");
    expect(r.auditReadiness).toBe(Math.round(((1 + 0.5) / 3) * 100)); // 50
  });
});

describe("certification expiry + reminders", () => {
  const now = new Date("2026-06-07T00:00:00Z");
  it("flags expiring within window", () => {
    expect(certStatus({ expiresAt: new Date("2026-06-29"), now })).toBe("expiring");
    expect(certStatus({ expiresAt: new Date("2027-06-07"), now })).toBe("valid");
    expect(certStatus({ expiresAt: new Date("2026-06-01"), now })).toBe("expired");
    expect(certStatus({ expiresAt: null, now })).toBe("valid");
  });
  it("fires the right reminder buckets and skips already-sent", () => {
    const expires = new Date("2026-06-29T00:00:00Z"); // 22 days out
    expect(dueReminders(expires, now)).toEqual([90, 60, 30]);
    expect(dueReminders(expires, now, [90, 60])).toEqual([30]);
  });
});

describe("career plan orders prerequisites first", () => {
  const skills: Skill[] = [
    { id: "linux", name: "Linux" },
    { id: "networking", name: "Networking", prerequisites: ["linux"] },
    { id: "aws", name: "AWS", prerequisites: ["networking"] },
  ];
  it("topologically orders the gap set", () => {
    expect(orderByPrerequisites(["aws", "linux", "networking"], skills)).toEqual([
      "linux", "networking", "aws",
    ]);
  });
  it("builds a roadmap with time + cost", () => {
    const plan = buildCareerPlan({
      targetRoleId: "cloud-architect",
      targetRequirements: [
        { skillId: "linux", targetLevel: 3, importance: "required" },
        { skillId: "aws", targetLevel: 3, importance: "required" },
      ],
      userSkills: [],
      skills,
      catalog: [
        { id: "k1", title: "Linux Basics", providerKey: "go1", durationMinutes: 300, priceCents: 0,
          skills: [{ skillId: "linux", confidence: 1 }] },
        { id: "k2", title: "AWS Architect", providerKey: "aws", durationMinutes: 900, priceCents: 4000,
          skills: [{ skillId: "aws", confidence: 1 }] },
      ],
    });
    expect(plan.steps[0].skillId).toBe("linux"); // prerequisite first
    expect(plan.estCostCents).toBe(4000);
    expect(plan.estMonths).toBeGreaterThanOrEqual(2);
  });
});

describe("skill reconciler", () => {
  const canonical: Skill[] = [
    { id: "k8s", name: "Kubernetes" },
    { id: "aws-sec", name: "AWS Security" },
  ];
  it("exact matches with full confidence", () => {
    expect(reconcileSkill("kubernetes", canonical).canonicalSkillId).toBe("k8s");
  });
  it("resolves aliases", () => {
    // alias keys are stored normalized: normalize("K8s") === "k8s"
    const aliases = new Map([["k8s", "k8s"]]);
    expect(reconcileSkill("K8s", canonical, { aliases }).canonicalSkillId).toBe("k8s");
  });
  it("returns null below threshold", () => {
    expect(reconcileSkill("flower arranging", canonical).canonicalSkillId).toBeNull();
  });
});
