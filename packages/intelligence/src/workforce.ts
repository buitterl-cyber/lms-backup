/**
 * Workforce planning — aggregate, org-level intelligence on top of per-person gap analysis.
 * Answers: which skills is the whole department short on, who is ready for a role, and where is
 * the succession / single-point-of-failure risk.
 */

import type { ProficiencyLevel, RoleRequirement, UserSkill } from "./types";
import { analyzeSkillGap } from "./skill-gap";

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

export function analyzeWorkforce(
  requirements: RoleRequirement[],
  team: TeamMemberProfile[],
): WorkforceAnalysis {
  const teamSize = team.length;
  const required = requirements.filter((r) => r.importance === "required");

  const coveredCount = new Map<string, number>();
  for (const r of required) coveredCount.set(r.skillId, 0);

  let coverageSum = 0;
  const readyForRole: string[] = [];

  for (const member of team) {
    const have = new Map(member.skills.map((s) => [s.skillId, s.level] as const));
    const { coverage } = analyzeSkillGap(requirements, member.skills);
    coverageSum += coverage;
    if (coverage >= 1) readyForRole.push(member.userId);
    for (const r of required) {
      if (((have.get(r.skillId) ?? 0) as ProficiencyLevel | 0) >= r.targetLevel) {
        coveredCount.set(r.skillId, (coveredCount.get(r.skillId) ?? 0) + 1);
      }
    }
  }

  const shortages: SkillShortage[] = required
    .map((r) => {
      const covered = coveredCount.get(r.skillId) ?? 0;
      return {
        skillId: r.skillId,
        peopleCovered: covered,
        peopleShort: teamSize - covered,
        coverage: teamSize === 0 ? 0 : covered / teamSize,
      };
    })
    .sort((a, b) => b.peopleShort - a.peopleShort);

  const singlePointsOfFailure = shortages.filter((s) => s.peopleCovered === 1).map((s) => s.skillId);

  return {
    teamSize,
    avgCoverage: teamSize === 0 ? 0 : coverageSum / teamSize,
    shortages,
    singlePointsOfFailure,
    readyForRole,
  };
}
