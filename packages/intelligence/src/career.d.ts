/**
 * Career Intelligence — builds an ordered roadmap from a current role to a target role.
 *
 * Steps: compute the skill gap to the target role's requirements, order gap skills so
 * prerequisites come first (topological-ish over the skill graph), fulfil each with the best
 * course, then estimate total time and cost.
 */
import type { CourseLite, RoleRequirement, Skill, UserSkill } from "./types";
export interface RoadmapStep {
    order: number;
    skillId: string;
    courseId: string;
    courseTitle: string;
    providerKey: string;
    estMinutes: number;
    estCostCents: number;
}
export interface CareerPlan {
    targetRoleId: string;
    gapSkillIds: string[];
    steps: RoadmapStep[];
    estMonths: number;
    estCostCents: number;
}
export interface BuildCareerPlanInput {
    targetRoleId: string;
    targetRequirements: RoleRequirement[];
    userSkills: UserSkill[];
    skills: Skill[];
    catalog: CourseLite[];
    /** learner pacing — study minutes available per month (default ~10h) */
    studyMinutesPerMonth?: number;
}
export declare function buildCareerPlan(input: BuildCareerPlanInput): CareerPlan;
/**
 * Order skill ids so prerequisites precede dependents. Kahn-style topological sort restricted
 * to the gap set; cycles/unknowns fall through in stable order.
 */
export declare function orderByPrerequisites(skillIds: string[], skills: Skill[]): string[];
