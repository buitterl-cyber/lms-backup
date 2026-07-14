import { Injectable } from "@nestjs/common";
import { getTenantContext } from "@riyada/shared";
import { certStatus, dueReminders, cpdProgress } from "@riyada/intelligence";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class CertificationService {
  constructor(private readonly prisma: PrismaService) {}

  /** A learner's earned certificates, newest first — feeds the dashboard certificates strip. */
  async forUser(userId: string) {
    const { tenantId } = getTenantContext();
    const certs = await this.prisma.db.earnedCertificate.findMany({
      where: { tenantId, userId },
      include: { certification: true },
      orderBy: { issuedAt: "desc" },
      take: 12,
    });
    return certs.map((c) => ({
      id: c.id,
      name: c.certification?.name ?? "Certificate",
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
      status: c.status,
      fileUrl: c.fileUrl,
    }));
  }

  /** Certificates expiring within N days across the org — feeds renewal campaigns. */
  async expiring(withinDays = 90) {
    const { tenantId } = getTenantContext();
    const now = new Date();
    const horizon = new Date(now.getTime() + withinDays * 86400_000);

    const certs = await this.prisma.db.earnedCertificate.findMany({
      where: { tenantId, expiresAt: { not: null, lte: horizon } },
      include: { user: true, certification: true },
      orderBy: { expiresAt: "asc" },
    });

    return certs.map((c) => ({
      id: c.id,
      user: `${c.user.firstName} ${c.user.lastName}`,
      certification: c.certification?.name ?? "Certificate",
      expiresAt: c.expiresAt,
      status: certStatus({ expiresAt: c.expiresAt, now }),
      reminders: c.expiresAt ? dueReminders(c.expiresAt, now) : [],
      cpd: c.certification?.cpdRequired
        ? cpdProgress(c.cpdHours ?? 0, c.certification.cpdRequired)
        : null,
    }));
  }

  /**
   * Expiry sweep — transitions statuses and returns the count moved. Runs as a scheduled job in
   * production (RabbitMQ producer -> this), here exposed for demonstration/manual trigger.
   */
  async runExpirySweep() {
    const { tenantId } = getTenantContext();
    const now = new Date();
    const all = await this.prisma.db.earnedCertificate.findMany({ where: { tenantId } });
    let changed = 0;
    for (const c of all) {
      const next = certStatus({ expiresAt: c.expiresAt, now });
      const mapped = next === "valid" ? "valid" : next === "expiring" ? "expiring" : "expired";
      if (mapped !== c.status) {
        await this.prisma.db.earnedCertificate.update({ where: { id: c.id }, data: { status: mapped } });
        changed++;
      }
    }
    return { swept: all.length, changed };
  }
}
