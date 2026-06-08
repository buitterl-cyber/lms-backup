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
    score: number;
    coveredSkillIds: string[];
    reason: string;
}
export interface RecommendOptions {
    /** cap returned recommendations */
    limit?: number;
    /** prefer cheaper courses when scores are close */
    costSensitive?: boolean;
}
export declare function recommendCourses(gaps: SkillGapItem[], catalog: CourseLite[], opts?: RecommendOptions): CourseRecommendation[];
