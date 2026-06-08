import { Injectable } from "@nestjs/common";
import { getTenantContext } from "@riyada/shared";
import { certStatus } from "@riyada/intelligence";
import { PrismaService } from "../../common/prisma/prisma.service";

/** In-app/email/push notifications + renewal campaigns. Email/push delivery is a transport seam;
 *  notifications are persisted here and a worker fans them out. */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const { tenantId } = getTenantContext();
    return this.prisma.db.notification.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async markRead(id: string) {
    return this.prisma.db.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  /** Create a renewal-campaign notification for everyone with a cert expiring within `withinDays`. */
  async renewalCampaign(withinDays = 90) {
    const { tenantId } = getTenantContext();
    const now = new Date();
    const horizon = new Date(now.getTime() + withinDays * 86400_000);
    const certs = await this.prisma.db.earnedCertificate.findMany({
      where: { tenantId, expiresAt: { not: null, lte: horizon } },
      include: { certification: true },
    });
    let created = 0;
    for (const c of certs) {
      if (certStatus({ expiresAt: c.expiresAt, now }) === "valid") continue;
      await this.prisma.db.notification.create({
        data: {
          tenantId,
          userId: c.userId,
          channel: "email",
          kind: "certification_renewal",
          payload: { certification: c.certification?.name, expiresAt: c.expiresAt },
        },
      });
      created++;
    }
    return { campaign: "certification_renewal", notificationsCreated: created };
  }
}
