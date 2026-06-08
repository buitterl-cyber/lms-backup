"use strict";
/**
 * Skill Gap Analysis — the canonical RiyadaIntel computation.
 *
 * Given what a role REQUIRES and what a person HAS, produce the deficit per skill and an overall
 * coverage score. This is the example from the founding brief (Cloud Security Engineer).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSkillGap = analyzeSkillGap;
exports.missingSkillIds = missingSkillIds;
function analyzeSkillGap(requirements, userSkills) {
    const have = new Map();
    for (const us of userSkills)
        have.set(us.skillId, us.level);
    const gaps = [];
    let requiredCount = 0;
    let requiredMet = 0;
    for (const req of requirements) {
        // 0 means "skill absent"; it is intentionally outside ProficiencyLevel, so keep it a number.
        const currentLevel = have.get(req.skillId) ?? 0;
        const deficit = Math.max(0, req.targetLevel - currentLevel);
        if (req.importance === "required") {
            requiredCount++;
            if (deficit === 0)
                requiredMet++;
        }
        if (deficit > 0) {
            gaps.push({
                skillId: req.skillId,
                targetLevel: req.targetLevel,
                currentLevel: (currentLevel === 0 ? 1 : currentLevel),
                importance: req.importance,
                deficit,
            });
        }
    }
    // Required gaps first, then by largest deficit — what to fix first.
    gaps.sort((a, b) => {
        if (a.importance !== b.importance)
            return a.importance === "required" ? -1 : 1;
        return b.deficit - a.deficit;
    });
    const coverage = requiredCount === 0 ? 1 : requiredMet / requiredCount;
    return { gaps, coverage };
}
/** Convenience: just the skill ids a person is missing (required + preferred). */
function missingSkillIds(result) {
    return result.gaps.map((g) => g.skillId);
}
