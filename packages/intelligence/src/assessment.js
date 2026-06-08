"use strict";
/**
 * Assessment auto-grading for objective question types. Essay/practical questions are routed to
 * AI/rubric grading elsewhere; this module handles deterministic grading (single, multiple,
 * true/false) so the LMS can score attempts instantly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradeAttempt = gradeAttempt;
const OBJECTIVE = new Set(["single", "multiple", "true_false"]);
function gradeAttempt(questions, responses, passScore = 70) {
    let scoredPoints = 0;
    let totalAutoGradablePoints = 0;
    const pendingManual = [];
    const perQuestion = [];
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
    const percent = totalAutoGradablePoints === 0 ? null : Math.round((scoredPoints / totalAutoGradablePoints) * 100);
    const passed = percent === null ? null : percent >= passScore;
    return { scoredPoints, totalAutoGradablePoints, percent, passed, pendingManual, perQuestion };
}
