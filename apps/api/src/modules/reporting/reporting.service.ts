import { Injectable } from "@nestjs/common";
import { getTenantContext, ValidationError } from "@riyada/shared";
import { certStatus } from "@riyada/intelligence";
import { PrismaService } from "../../common/prisma/prisma.service";

export type ReportKind = "learning" | "compliance" | "skills" | "certification" | "revenue" | "readiness";

/** Tenant-scoped reports. CSV + JSON are produced here for real; PDF/Excel/PowerBI are
 *  serializer seams (pdfkit/exceljs/connector) over the same row sets. */
@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async rows(kind: ReportKind): Promise<Record<string, unknown>[]> {
    const { tenantId } = getTenantContext();
    switch (kind) {
      case "learning": {
        const e = await this.prisma.db.enrollment.findMany({ where: { tenantId }, include: { user: true, course: true } });
        return e.map((r) => ({ user: `${r.user.firstName} ${r.user.lastName}`, course: r.course.title, status: r.status, percent: r.percent, completedAt: r.completedAt ?? "" }));
      }
      case "compliance": {
        const a = await this.prisma.db.complianceAssignment.findMany({ where: { tenantId }, include: { user: true, control: { include: { framework: true } } } });
        return a.map((r) => ({ user: `${r.user.firstName} ${r.user.lastName}`, framework: r.control.framework.name, control: r.control.code, status: r.status, dueAt: r.dueAt ?? "" }));
      }
      case "skills": {
        const s = await this.prisma.db.userSkill.findMany({ where: { user: { tenantId } }, include: { user: true, skill: true } });
        return s.map((r) => ({ user: `${r.user.firstName} ${r.user.lastName}`, skill: r.skill.name, level: r.level, source: r.source }));
      }
      case "certification": {
        const now = new Date();
        const c = await this.prisma.db.earnedCertificate.findMany({ where: { tenantId }, include: { user: true, certification: true } });
        return c.map((r) => ({ user: `${r.user.firstName} ${r.user.lastName}`, certification: r.certification?.name ?? "", expiresAt: r.expiresAt ?? "", status: certStatus({ expiresAt: r.expiresAt, now }), cpdHours: r.cpdHours ?? 0 }));
      }
      case "revenue": {
        const o = await this.prisma.db.order.findMany({ where: { tenantId } });
        return o.map((r) => ({ orderId: r.id, total: (r.totalCents / 100).toFixed(2), currency: r.currency, status: r.status, createdAt: r.createdAt }));
      }
      case "readiness": {
        const u = await this.prisma.db.user.findMany({ where: { tenantId }, include: { userSkills: true, currentRole: true } });
        return u.map((r) => ({ user: `${r.firstName} ${r.lastName}`, role: r.currentRole?.name ?? "", skills: r.userSkills.length }));
      }
      default:
        throw new ValidationError(`Unknown report kind: ${kind}`);
    }
  }

  toCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [headers.join(","), ...rows.map((row) => headers.map((h) => esc(row[h])).join(","))].join("\n");
  }
}
