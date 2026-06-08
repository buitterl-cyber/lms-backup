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
export declare function evaluateControl(input: ControlEvaluationInput): ControlEvaluation;
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
export declare function rollupDepartmentRisk(evals: ControlEvaluation[]): DepartmentRisk;
