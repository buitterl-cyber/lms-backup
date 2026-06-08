"use strict";
/**
 * Workforce planning — aggregate, org-level intelligence on top of per-person gap analysis.
 * Answers: which skills is the whole department short on, who is ready for a role, and where is
 * the succession / single-point-of-failure risk.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeWorkforce = analyzeWorkforce;
const skill_gap_1 = require("./skill-gap");
function analyzeWorkforce(requirements, team) {
    const teamSize = team.length;
    const required = requirements.filter((r) => r.importance === "required");
    const coveredCount = new Map();
    for (const r of required)
        coveredCount.set(r.skillId, 0);
    let coverageSum = 0;
    const readyForRole = [];
    for (const member of team) {
        const have = new Map(member.skills.map((s) => [s.skillId, s.level]));
        const { coverage } = (0, skill_gap_1.analyzeSkillGap)(requirements, member.skills);
        coverageSum += coverage;
        if (coverage >= 1)
            readyForRole.push(member.userId);
        for (const r of required) {
            if ((have.get(r.skillId) ?? 0) >= r.targetLevel) {
                coveredCount.set(r.skillId, (coveredCount.get(r.skillId) ?? 0) + 1);
            }
        }
    }
    const shortages = required
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
