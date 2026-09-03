import { Injectable } from "@nestjs/common";
import crypto from "node:crypto";
import { prisma } from "@riyada/database";

/**
 * Privacy-friendly first-party pageview analytics — no cookies, no persistent visitor id.
 * visitorHash rotates daily (day + ip + user-agent, salted and truncated) so the same person
 * can't be tracked across days or tied back to their real IP; it exists only to approximate
 * daily unique visitors, the same way Plausible/Fathom do it. Nothing here is a cookie or
 * personal data under GDPR's ePrivacy rules, so no consent banner is required to run it.
 */
@Injectable()
export class AnalyticsService {
  private visitorHash(ip: string, userAgent: string): string {
    const day = new Date().toISOString().slice(0, 10);
    const salt = process.env.ANALYTICS_SALT || "riyada-analytics";
    return crypto.createHash("sha256").update(`${salt}:${day}:${ip}:${userAgent}`).digest("hex").slice(0, 16);
  }

  async record(input: { path: string; referrer?: string; ip: string; userAgent: string }) {
    await prisma.pageView.create({
      data: {
        path: input.path.slice(0, 500),
        referrer: input.referrer?.slice(0, 500),
        visitorHash: this.visitorHash(input.ip, input.userAgent),
      },
    });
    return { recorded: true };
  }

  async summary(days = 14) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const views = await prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      select: { path: true, visitorHash: true, createdAt: true },
    });
    const totalViews = views.length;
    const uniqueVisitors = new Set(views.map((v) => v.visitorHash)).size;
    const byPath = new Map<string, number>();
    for (const v of views) byPath.set(v.path, (byPath.get(v.path) ?? 0) + 1);
    const topPaths = [...byPath.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([path, count]) => ({ path, count }));
    return { since: since.toISOString(), totalViews, uniqueVisitors, topPaths };
  }
}
