import { Injectable } from "@nestjs/common";
import { runWithTenant } from "@riyada/shared";
import { certStatus } from "@riyada/intelligence";
import { prisma } from "@riyada/database";
import { TeamService } from "../modules/workforce/team.service";

/**
 * Scheduled background jobs. In production a cron producer enqueues these to RabbitMQ and KEDA
 * scales the worker on queue depth; the logic lives here so it's the same whether triggered by
 * the scheduler, an admin endpoint, or a test. Each job iterates tenants and runs inside that
 * tenant's context (so RLS + queries scope correctly).
 */
@Injectable()
export class JobsService {
  constructor(private readonly team: TeamService) {
    // In-process scheduler (prod = cron→RabbitMQ): auto-nudge every 12h, first pass 2 min
    // after boot. unref() so a hanging timer never keeps a dying process alive.
    setTimeout(() => void this.nudgeSweep().catch(() => undefined), 2 * 60_000).unref();
    setInterval(() => void this.nudgeSweep().catch(() => undefined), 12 * 3600_000).unref();
  }

  /** Transition cert statuses (valid->expiring->expired) across all tenants. Emits would-be
   *  `certification.expiring` events for the notification/compliance consumers. */
  async expirySweep() {
    const now = new Date();
    const tenants = await prisma.tenant.findMany({ select: { id: true } });
    let changed = 0;
    for (const t of tenants) {
      changed += await runWithTenant({ tenantId: t.id, organizationId: "", userId: null, roles: ["super_admin"] }, async () => {
        const certs = await prisma.earnedCertificate.findMany({ where: { tenantId: t.id } });
        let n = 0;
        for (const c of certs) {
          const next = certStatus({ expiresAt: c.expiresAt, now });
          const mapped = next === "valid" ? "valid" : next === "expiring" ? "expiring" : "expired";
          if (mapped !== c.status) {
            await prisma.earnedCertificate.update({ where: { id: c.id }, data: { status: mapped } });
            n++;
          }
        }
        return n;
      });
    }
    return { job: "expiry-sweep", changed };
  }

  /** Recompute compliance assignment status from completed training + cert validity. */
  async complianceRiskRecompute() {
    const now = new Date();
    const assignments = await prisma.complianceAssignment.findMany({ include: { control: true } });
    let updated = 0;
    for (const a of assignments) {
      const completed = await prisma.enrollment.findMany({ where: { userId: a.userId, status: "completed" }, select: { courseId: true } });
      const done = new Set(completed.map((e) => e.courseId));
      const missing = a.control.requiredCourseIds.filter((id) => !done.has(id));
      let status = "compliant";
      if (a.control.requiredCertificationIds.length) {
        const certs = await prisma.earnedCertificate.findMany({ where: { userId: a.userId, certificationId: { in: a.control.requiredCertificationIds } } });
        const bad = a.control.requiredCertificationIds.some((id) => {
          const c = certs.find((x) => x.certificationId === id);
          return !c || certStatus({ expiresAt: c.expiresAt, now }) === "expired";
        });
        if (bad) status = "at_risk";
      }
      if (status === "compliant" && missing.length) status = a.dueAt && a.dueAt < now ? "at_risk" : "due";
      if (status !== a.status) {
        await prisma.complianceAssignment.update({ where: { id: a.id }, data: { status } });
        updated++;
      }
    }
    return { job: "compliance-risk-recompute", updated };
  }

  /** Enqueue a catalog sync per active provider connection (the worker calls provider.syncCatalog). */
  async enqueueCatalogSyncs() {
    const conns = await prisma.providerConnection.findMany({ where: { status: "active" }, select: { id: true, providerKey: true } });
    // In production: publish one `catalog.sync.requested` event per connection.
    return { job: "catalog-sync", enqueued: conns.length, connections: conns.map((c) => c.providerKey) };
  }

  /**
   * Auto-nudge sweep (Carl's "learners run out of time" fix): remind anyone whose active
   * enrollment is due within 5 days and unfinished, or who has been inactive 14+ days with
   * open courses. TeamService dedupes to one auto-nudge per learner/course/kind per 7 days.
   */
  async nudgeSweep() {
    const now = Date.now();
    const DAY = 86_400_000;
    const tenants = await prisma.tenant.findMany({ select: { id: true } });
    let sent = 0;
    for (const t of tenants) {
      const orgs = await prisma.organization.findMany({ where: { tenantId: t.id }, select: { id: true } });
      for (const org of orgs) {
        sent += await runWithTenant(
          { tenantId: t.id, organizationId: org.id, userId: null, roles: ["super_admin"] },
          async () => {
            let n = 0;
            const dueSoon = await prisma.enrollment.findMany({
              where: {
                tenantId: t.id, percent: { lt: 100 }, status: { notIn: ["completed", "expired"] },
                dueAt: { not: null, lte: new Date(now + 5 * DAY) },
              },
            });
            for (const e of dueSoon) {
              const r = await this.team.nudge({ learnerId: e.userId, courseId: e.courseId, kind: "auto_deadline", senderId: "system" });
              if ((r as { nudged?: boolean }).nudged) n++;
            }
            const open = await prisma.enrollment.findMany({
              where: { tenantId: t.id, percent: { lt: 100 }, status: { notIn: ["completed", "expired"] } },
              distinct: ["userId"], select: { userId: true },
            });
            for (const { userId } of open) {
              const last = await prisma.activityEvent.findFirst({
                where: { tenantId: t.id, userId }, orderBy: { createdAt: "desc" }, select: { createdAt: true },
              });
              if (last && now - last.createdAt.getTime() >= 14 * DAY) {
                const r = await this.team.nudge({ learnerId: userId, kind: "auto_inactive", senderId: "system" });
                if ((r as { nudged?: boolean }).nudged) n++;
              }
            }
            return n;
          },
        );
      }
    }
    return { job: "nudge-sweep", nudgesSent: sent };
  }
}
