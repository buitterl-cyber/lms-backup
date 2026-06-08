/**
 * Pure domain types for the intelligence engines. These libraries are deliberately
 * framework-free and side-effect-free: they take plain data in and return decisions out, so the
 * moat is unit-testable in isolation and reusable by api, jobs, and (later) mobile.
 */

export type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;
export type RiskColor = "green" | "amber" | "red";

export interface Skill {
  id: string;
  name: string;
  /** prerequisite skill ids — used to order learning roadmaps */
  prerequisites?: string[];
}

export interface UserSkill {
  skillId: string;
  level: ProficiencyLevel;
}

export interface RoleRequirement {
  skillId: string;
  targetLevel: ProficiencyLevel;
  importance: "required" | "preferred";
}

export interface CourseLite {
  id: string;
  title: string;
  providerKey: string;
  /** skills this course teaches, with mapping confidence 0..1 */
  skills: { skillId: string; confidence: number }[];
  durationMinutes?: number;
  level?: "beginner" | "intermediate" | "advanced" | "expert";
  priceCents?: number;
  rating?: number; // 0..5
}

export interface SkillGapItem {
  skillId: string;
  targetLevel: ProficiencyLevel;
  currentLevel: ProficiencyLevel; // 0 expressed as 1 floor; see hasGap
  importance: "required" | "preferred";
  deficit: number; // targetLevel - currentLevel, > 0 when a gap exists
}

export interface SkillGapResult {
  gaps: SkillGapItem[];
  coverage: number; // 0..1 share of required skills already met
}
