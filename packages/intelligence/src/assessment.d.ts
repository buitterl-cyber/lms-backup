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
    perQuestion: {
        id: string;
        correct: boolean | null;
        awarded: number;
    }[];
}
export declare function gradeAttempt(questions: GradableQuestion[], responses: Record<string, string[]>, passScore?: number): GradeResult;
