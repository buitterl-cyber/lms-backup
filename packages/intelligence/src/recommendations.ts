/**
 * Recommendation engine — maps skill gaps to the best courses, with an explainable reason.
 * Ranking blends: how well a course covers the gap skills (weighted by deficit + mapping
 * confidence), provider/course rating, and level fit. Every recommendation carries a `reason`
 * string because explainability is a product requirement.
 */

import type { CourseLite, SkillGapItem } from "./types";

export interface CourseRecommendation {
  courseId: string;
  title: string;
  providerKey: string;
  score: number; // higher is better
  coveredSkillIds: string[];
  reason: string;
}

export interface RecommendOptions {
  /** cap returned recommendations */
  limit?: number;
  /** prefer cheaper courses when scores are close */
  costSensitive?: boolean;
}

export function recommendCourses(
  gaps: SkillGapItem[],
  catalog: CourseLite[],
  opts: RecommendOptions = {},
): CourseRecommendation[] {
  const deficitBySkill = new Map<string, SkillGapItem>();
  for (const g of gaps) deficitBySkill.set(g.skillId, g);

  const recs: CourseRecommendation[] = [];

  for (const course of catalog) {
    const covered: string[] = [];
    let gapScore = 0;
    for (const cs of course.skills) {
      const gap = deficitBySkill.get(cs.skillId);
      if (!gap) continue;
      covered.push(cs.skillId);
      // weight by how big the gap is, how important, and how confident the skill mapping is
      const importanceWeight = gap.importance === "required" ? 1 : 0.5;
      gapScore += gap.deficit * importanceWeight * cs.confidence;
    }
    if (covered.length === 0) continue;

    const ratingBoost = (course.rating ?? 3.5) / 5; // 0..1
    let score = gapScore * (0.7 + 0.3 * ratingBoost);
    if (opts.costSensitive && course.priceCents != null) {
      score = score / (1 + course.priceCents / 50000); // gentle cost penalty
    }

    recs.push({
      courseId: course.id,
      title: course.title,
      providerKey: course.providerKey,
      score,
      coveredSkillIds: covered,
      reason: buildReason(covered, course),
    });
  }

  recs.sort((a, b) => b.score - a.score);
  return opts.limit ? recs.slice(0, opts.limit) : recs;
}

function buildReason(coveredSkillIds: string[], course: CourseLite): string {
  const n = coveredSkillIds.length;
  const skills = n === 1 ? "1 skill gap" : `${n} skill gaps`;
  return `Closes ${skills} for your role via ${course.providerKey}${
    course.rating ? ` (rated ${course.rating.toFixed(1)}/5)` : ""
  }.`;
}
