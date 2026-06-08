/**
 * Career Intelligence — builds an ordered roadmap from a current role to a target role.
 *
 * Steps: compute the skill gap to the target role's requirements, order gap skills so
 * prerequisites come first (topological-ish over the skill graph), fulfil each with the best
 * course, then estimate total time and cost.
 */

import type { CourseLite, RoleRequirement, Skill, UserSkill } from "./types";
import { analyzeSkillGap } from "./skill-gap";
import { recommendCourses } from "./recommendations";

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
  skills: Skill[]; // for prerequisite ordering
  catalog: CourseLite[];
  /** learner pacing — study minutes available per month (default ~10h) */
  studyMinutesPerMonth?: number;
}

export function buildCareerPlan(input: BuildCareerPlanInput): CareerPlan {
  const { gaps } = analyzeSkillGap(input.targetRequirements, input.userSkills);
  const gapSkillIds = gaps.map((g) => g.skillId);

  const ordered = orderByPrerequisites(gapSkillIds, input.skills);

  const steps: RoadmapStep[] = [];
  let order = 1;
  let estCostCents = 0;
  let estMinutes = 0;

  for (const skillId of ordered) {
    const gap = gaps.find((g) => g.skillId === skillId);
    if (!gap) continue;
    const [best] = recommendCourses([gap], input.catalog, { limit: 1, costSensitive: true });
    if (!best) continue;
    const course = input.catalog.find((c) => c.id === best.courseId)!;
    const minutes = course.durationMinutes ?? 120;
    const cost = course.priceCents ?? 0;
    estMinutes += minutes;
    estCostCents += cost;
    steps.push({
      order: order++,
      skillId,
      courseId: course.id,
      courseTitle: course.title,
      providerKey: course.providerKey,
      estMinutes: minutes,
      estCostCents: cost,
    });
  }

  const perMonth = input.studyMinutesPerMonth ?? 600;
  const estMonths = Math.max(1, Math.ceil(estMinutes / perMonth));

  return { targetRoleId: input.targetRoleId, gapSkillIds, steps, estMonths, estCostCents };
}

/**
 * Order skill ids so prerequisites precede dependents. Kahn-style topological sort restricted
 * to the gap set; cycles/unknowns fall through in stable order.
 */
export function orderByPrerequisites(skillIds: string[], skills: Skill[]): string[] {
  const inSet = new Set(skillIds);
  const prereqs = new Map<string, string[]>();
  for (const s of skills) {
    if (!inSet.has(s.id)) continue;
    prereqs.set(s.id, (s.prerequisites ?? []).filter((p) => inSet.has(p)));
  }

  const result: string[] = [];
  const done = new Set<string>();
  let progressed = true;
  while (result.length < skillIds.length && progressed) {
    progressed = false;
    for (const id of skillIds) {
      if (done.has(id)) continue;
      const deps = prereqs.get(id) ?? [];
      if (deps.every((d) => done.has(d))) {
        result.push(id);
        done.add(id);
        progressed = true;
      }
    }
  }
  // append any leftover (cyclic) ids in original order
  for (const id of skillIds) if (!done.has(id)) result.push(id);
  return result;
}
