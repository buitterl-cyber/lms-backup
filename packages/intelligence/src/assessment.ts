/**
 * Assessment auto-grading for objective question types. Essay/practical questions are routed to
 * AI/rubric grading elsewhere; this module handles deterministic grading (single, multiple,
 * true/false) so the LMS can score attempts instantly.
 */

export type ObjectiveType = "single" | "multiple" | "true_false";

export interface GradableQuestion {
  id: string;
  type: ObjectiveType | "essay" | "practical" | "file_upload";
  /** canonical correct answer(s); for `multiple` this is the full correct set */
  answerKey?: string[];
  points: number;
}

export interface GradeResult {
  scoredPoints: number;
  totalAutoGradablePoints: number;
  /** 0..100 over auto-gradable points; null if nothing was auto-gradable */
  percent: number | null;
  passed: boolean | null;
  /** questions needing human/AI grading (essay/practical/file_upload) */
  pendingManual: string[];
  perQuestion: { id: string; correct: boolean | null; awarded: number }[];
}

const OBJECTIVE = new Set<string>(["single", "multiple", "true_false"]);

export function gradeAttempt(
  questions: GradableQuestion[],
  responses: Record<string, string[]>,
  passScore = 70,
): GradeResult {
  let scoredPoints = 0;
  let totalAutoGradablePoints = 0;
  const pendingManual: string[] = [];
  const perQuestion: GradeResult["perQuestion"] = [];

  for (const q of questions) {
    if (!OBJECTIVE.has(q.type)) {
      pendingManual.push(q.id);
      perQuestion.push({ id: q.id, correct: null, awarded: 0 });
      continue;
    }
    totalAutoGradablePoints += q.points;
    const given = new Set(responses[q.id] ?? []);
    const key = new Set(q.answerKey ?? []);
    const correct = given.size === key.size && [...key].every((k) => given.has(k));
    const awarded = correct ? q.points : 0;
    scoredPoints += awarded;
    perQuestion.push({ id: q.id, correct, awarded });
  }

  const percent =
    totalAutoGradablePoints === 0 ? null : Math.round((scoredPoints / totalAutoGradablePoints) * 100);
  const passed = percent === null ? null : percent >= passScore;

  return { scoredPoints, totalAutoGradablePoints, percent, passed, pendingManual, perQuestion };
}
