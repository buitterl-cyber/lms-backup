/**
 * Workforce planning — aggregate, org-level intelligence on top of per-person gap analysis.
 * Answers: which skills is the whole department short on, who is ready for a role, and where is
 * the succession / single-point-of-failure risk.
 */
import type { RoleRequirement, UserSkill } from "./types";
export interface TeamMemberProfile {
    userId: string;
    skills: UserSkill[];
}
export interface SkillShortage {
    skillId: string;
    /** how many people are below the target level */
    peopleShort: number;
    /** how many people meet/exceed it */
    peopleCovered: number;
    /** 0..1 share of the team that has it at target */
    coverage: number;
}
export interface WorkforceAnalysis {
    teamSize: number;
    /** average required-skill coverage across the team, 0..1 */
    avgCoverage: number;
    /** shortages sorted by most people-short first — the org's training priorities */
    shortages: SkillShortage[];
    /** skills held at target by only one person — succession / bus-factor risk */
    singlePointsOfFailure: string[];
    /** userIds who already meet all required skills for the role */
    readyForRole: string[];
}
export declare function analyzeWorkforce(requirements: RoleRequirement[], team: TeamMemberProfile[]): WorkforceAnalysis;
