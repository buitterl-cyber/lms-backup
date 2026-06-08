import { Injectable } from "@nestjs/common";
import { getTenantContext } from "@riyada/shared";
import { evaluateControl, rollupDepartmentRisk, certStatus, type RiskColor } from "@riyada/intelligence";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Department compliance dashboard: evaluate every control assignment in the department to
   * green/amber/red, then roll up to a department risk + audit readiness score.
   */
  async departmentDashboard(departmentId: string) {
    const { tenantId } = getTenantContext();
    const now = new Date();

    const assignments = await this.prisma.db.complianceAssignment.findMany({
      where: { tenantId, user: { departmentId } },
      include: { control: { include: { framework: true } }, user: true },
    });

    const evals = [];
    for (const a of assignments) {
      const completed = await this.prisma.db.enrollment.findMany({
        where: { userId: a.userId, status: "completed" },
        select: { courseId: true },
      });
      const completedCourseIds = new Set(completed.map((e) => e.courseId));

      const certStatusMap = await this.buildCertStatus(a.userId, a.control.requiredCertificationIds, now);

      const evaluation = evaluateControl({
        controlId: a.controlId,
        requiredCourseIds: a.control.requiredCourseIds,
        requiredCertificationIds: a.control.requiredCertificationIds,
        completedCourseIds,
        certStatus: certStatusMap,
        dueAt: a.dueAt ?? undefined,
        now,
      });
      evals.push({ ...evaluation, user: `${a.user.firstName} ${a.user.lastName}`, framework: a.control.framework.name, code: a.control.code });

      // keep the stored status in sync for fast reads
      const dbStatus = mapToDbStatus(evaluation.status);
      if (dbStatus !== a.status) {
        await this.prisma.db.complianceAssignment.update({ where: { id: a.id }, data: { status: dbStatus } });
      }
    }

    return { departmentId, risk: rollupDepartmentRisk(evals), controls: evals };
  }

  private async buildCertStatus(userId: string, certificationIds: string[], now: Date) {
    const map = new Map<string, "valid" | "expiring" | "expired" | "missing">();
    if (certificationIds.length === 0) return map;
    const earned = await this.prisma.db.earnedCertificate.findMany({
      where: { userId, certificationId: { in: certificationIds } },
    });
    for (const id of certificationIds) {
      const e = earned.find((x) => x.certificationId === id);
      map.set(id, e ? certStatus({ expiresAt: e.expiresAt, now }) : "missing");
    }
    return map;
  }
}

function mapToDbStatus(color: RiskColor): string {
  return color === "green" ? "compliant" : color === "amber" ? "due" : "at_risk";
}
