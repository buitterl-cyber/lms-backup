import { describe, it, expect } from "vitest";
import { gradeAttempt, analyzeWorkforce } from "../src/index";
import type { GradableQuestion, RoleRequirement, TeamMemberProfile } from "../src/index";

describe("assessment auto-grading", () => {
  const questions: GradableQuestion[] = [
    { id: "q1", type: "single", answerKey: ["b"], points: 1 },
    { id: "q2", type: "multiple", answerKey: ["a", "c"], points: 2 },
    { id: "q3", type: "true_false", answerKey: ["true"], points: 1 },
    { id: "q4", type: "essay", points: 5 },
  ];

  it("grades objective questions and defers essays", () => {
    const r = gradeAttempt(questions, { q1: ["b"], q2: ["a", "c"], q3: ["false"], q4: ["..."] }, 70);
    expect(r.scoredPoints).toBe(3); // q1 + q2 correct, q3 wrong
    expect(r.totalAutoGradablePoints).toBe(4);
    expect(r.percent).toBe(75);
    expect(r.passed).toBe(true);
    expect(r.pendingManual).toEqual(["q4"]);
  });

  it("multiple-choice requires the exact set", () => {
    const r = gradeAttempt([{ id: "q2", type: "multiple", answerKey: ["a", "c"], points: 2 }], { q2: ["a"] });
    expect(r.perQuestion[0].correct).toBe(false); // partial is not credited
  });

  it("returns null percent when nothing is auto-gradable", () => {
    const r = gradeAttempt([{ id: "q4", type: "essay", points: 5 }], {});
    expect(r.percent).toBeNull();
    expect(r.passed).toBeNull();
  });
});

describe("workforce planning", () => {
  const required: RoleRequirement[] = [
    { skillId: "aws", targetLevel: 3, importance: "required" },
    { skillId: "k8s", targetLevel: 3, importance: "required" },
    { skillId: "terraform", targetLevel: 3, importance: "required" },
  ];
  const team: TeamMemberProfile[] = [
    { userId: "u1", skills: [{ skillId: "aws", level: 4 }, { skillId: "k8s", level: 3 }, { skillId: "terraform", level: 3 }] }, // ready
    { userId: "u2", skills: [{ skillId: "aws", level: 4 }] },
    { userId: "u3", skills: [{ skillId: "aws", level: 3 }] },
  ];

  it("surfaces org-level shortages, SPOFs, and who's ready", () => {
    const a = analyzeWorkforce(required, team);
    expect(a.teamSize).toBe(3);
    expect(a.readyForRole).toEqual(["u1"]);
    // terraform & k8s are each held by only u1 -> single points of failure
    expect(a.singlePointsOfFailure).toEqual(expect.arrayContaining(["k8s", "terraform"]));
    // aws is the best-covered skill; shortages sorted most-short first
    const aws = a.shortages.find((s) => s.skillId === "aws")!;
    expect(aws.peopleCovered).toBe(3);
    expect(a.shortages[0].peopleShort).toBeGreaterThanOrEqual(aws.peopleShort);
  });
});
