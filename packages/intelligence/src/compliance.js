"use strict";
/**
 * Compliance Intelligence — green / amber / red scoring per control and rollups per department.
 *
 * A control is satisfied when all required training is complete AND all required certs are
 * valid. Amber = work outstanding but not overdue (or a cert inside its renewal window).
 * Red = overdue training or an expired/missing required cert.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateControl = evaluateControl;
exports.rollupDepartmentRisk = rollupDepartmentRisk;
function evaluateControl(input) {
    const missingCourseIds = input.requiredCourseIds.filter((id) => !input.completedCourseIds.has(id));
    const expiredOrMissingCerts = input.requiredCertificationIds.filter((id) => {
        const s = input.certStatus.get(id) ?? "missing";
        return s === "expired" || s === "missing";
    });
    const expiringCerts = input.requiredCertificationIds.filter((id) => input.certStatus.get(id) === "expiring");
    const overdue = input.dueAt != null && input.dueAt.getTime() < input.now.getTime();
    let status;
    let reason;
    if (expiredOrMissingCerts.length > 0 || (missingCourseIds.length > 0 && overdue)) {
        status = "red";
        reason = expiredOrMissingCerts.length
            ? `Expired/missing required certification(s): ${expiredOrMissingCerts.length}.`
            : `Training overdue (${missingCourseIds.length} course(s) past due).`;
    }
    else if (missingCourseIds.length > 0 || expiringCerts.length > 0) {
        status = "amber";
        reason = missingCourseIds.length
            ? `${missingCourseIds.length} required course(s) outstanding.`
            : `${expiringCerts.length} certification(s) within renewal window.`;
    }
    else {
        status = "green";
        reason = "All required training complete and certifications valid.";
    }
    return {
        controlId: input.controlId,
        status,
        missingCourseIds,
        problemCertIds: [...expiredOrMissingCerts, ...expiringCerts],
        reason,
    };
}
/** Roll control evaluations (across all people/controls in a dept) into a department risk. */
function rollupDepartmentRisk(evals) {
    const total = evals.length;
    const green = evals.filter((e) => e.status === "green").length;
    const amber = evals.filter((e) => e.status === "amber").length;
    const red = evals.filter((e) => e.status === "red").length;
    // weight greens fully, ambers half, reds zero
    const auditReadiness = total === 0 ? 100 : Math.round(((green + amber * 0.5) / total) * 100);
    const status = red > 0 ? "red" : amber > 0 ? "amber" : "green";
    return { total, green, amber, red, auditReadiness, status };
}
