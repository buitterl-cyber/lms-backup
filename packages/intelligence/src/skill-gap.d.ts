/**
 * Skill Gap Analysis — the canonical RiyadaIntel computation.
 *
 * Given what a role REQUIRES and what a person HAS, produce the deficit per skill and an overall
 * coverage score. This is the example from the founding brief (Cloud Security Engineer).
 */
import type { RoleRequirement, SkillGapResult, UserSkill } from "./types";
export declare function analyzeSkillGap(requirements: RoleRequirement[], userSkills: UserSkill[]): SkillGapResult;
/** Convenience: just the skill ids a person is missing (required + preferred). */
export declare function missingSkillIds(result: SkillGapResult): string[];
