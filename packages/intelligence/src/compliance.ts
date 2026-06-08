/**
 * Compliance Intelligence — green / amber / red scoring per control and rollups per department.
 *
 * A control is satisfied when all required training is complete AND all required certs are
 * valid. Amber = work outstanding but not overdue (or a cert inside its renewal window).
 * Red = overdue training or an expired/missing required cert.
 */

import type { RiskColor } from "./types";

export interface ControlEvaluationInput {
  controlId: string;
  requiredCourseIds: string[];
  requiredCertificationIds: string[];
  /** course ids the user has completed */
  completedCourseIds: Set<string>;
  /** certification id -> status from Certification Intelligence */
  certStatus: Map<string, "valid" | "expiring" | "expired" | "missing">;
  /** optional due date for the training */
  dueAt?: Date;
  now: Date;
}

export interface ControlEvaluation {
  controlId: string;
  status: RiskColor;
  missingCourseIds: string[];
  problemCertIds: string[];
  reason: string;
}

export function evaluateControl(input: ControlEvaluationInput): ControlEvaluation {
  const missingCourseIds = input.requiredCourseIds.filter(
    (id) => !input.completedCourseIds.has(id),
  );

  const expiredOrMissingCerts = input.requiredCertificationIds.filter((id) => {
    const s = input.certStatus.get(id) ?? "missing";
    return s === "expired" || s === "missing";
  });
  const expiringCerts = input.requiredCertificationIds.filter(
    (id) => input.certStatus.get(id) === "expiring",
  );

  const overdue = input.dueAt != null && input.dueAt.getTime() < input.now.getTime();

  let status: RiskColor;
  let reason: string;

  if (expiredOrMissingCerts.length > 0 || (missingCourseIds.length > 0 && overdue)) {
    status = "red";
    reason = expiredOrMissingCerts.length
      ? `Expired/missing required certification(s): ${expiredOrMissingCerts.length}.`
      : `Training overdue (${missingCourseIds.length} course(s) past due).`;
  } else if (missingCourseIds.length > 0 || expiringCerts.length > 0) {
    status = "amber";
    reason = missingCourseIds.length
      ? `${missingCourseIds.length} required course(s) outstanding.`
      : `${expiringCerts.length} certification(s) within renewal window.`;
  } else {
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

export interface DepartmentRisk {
  total: number;
  green: number;
  amber: number;
  red: number;
  /** 0..100; 100 = fully audit-ready */
  auditReadiness: number;
  status: RiskColor;
}

/** Roll control evaluations (across all people/controls in a dept) into a department risk. */
export function rollupDepartmentRisk(evals: ControlEvaluation[]): DepartmentRisk {
  const total = evals.length;
  const green = evals.filter((e) => e.status === "green").length;
  const amber = evals.filter((e) => e.status === "amber").length;
  const red = evals.filter((e) => e.status === "red").length;

  // weight greens fully, ambers half, reds zero
  const auditReadiness = total === 0 ? 100 : Math.round(((green + amber * 0.5) / total) * 100);
  const status: RiskColor = red > 0 ? "red" : amber > 0 ? "amber" : "green";

  return { total, green, amber, red, auditReadiness, status };
}
