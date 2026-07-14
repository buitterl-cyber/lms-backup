import { Injectable } from "@nestjs/common";
import { getTenantContext } from "@riyada/shared";
import { PrismaService } from "../../common/prisma/prisma.service";

/** XP per action. Kept server-side so clients can never mint XP. */
const XP: Record<string, number> = {
  course_completed: 250,
  module_completed: 40,
  forum_post: 15,
  forum_reply: 10,
  forum_upvote: 5,
  assessment_passed: 100,
};

const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Gamification engine — activity events, XP ledger, streaks, badges, leaderboard.
 * All awards happen server-side in reaction to real product events (completion, forum posts),
 * mirroring how EnrollmentService levels up skills on completion.
 */
@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  /** Record an activity event (drives last-active, streaks, and the manager heatmap). */
  async recordActivity(userId: string, kind: string, refId?: string) {
    const { tenantId } = getTenantContext();
    await this.prisma.db.activityEvent.create({ data: { tenantId, userId, kind, refId } });
  }

  /** Award XP for a product event and re-check badges. Never throws. */
  async award(userId: string, reason: keyof typeof XP | string, refId?: string, amount?: number) {
    try {
      const { tenantId } = getTenantContext();
      const xp = amount ?? XP[reason] ?? 0;
      if (xp > 0) {
        await this.prisma.db.xpEvent.create({ data: { tenantId, userId, amount: xp, reason, refId } });
      }
      await this.checkBadges(userId);
    } catch {
      /* gamification must never fail the triggering request */
    }
  }

  async profile(userId: string) {
    const { tenantId } = getTenantContext();
    const [xpAgg, weekAgg, earned, events] = await Promise.all([
      this.prisma.db.xpEvent.aggregate({ where: { tenantId, userId }, _sum: { amount: true } }),
      this.prisma.db.xpEvent.aggregate({
        where: { tenantId, userId, createdAt: { gte: new Date(Date.now() - 7 * DAY) } },
        _sum: { amount: true },
      }),
      this.prisma.db.earnedBadge.findMany({ where: { tenantId, userId }, include: { badge: true } }),
      this.prisma.db.activityEvent.findMany({
        where: { tenantId, userId, createdAt: { gte: new Date(Date.now() - 60 * DAY) } },
        select: { createdAt: true },
      }),
    ]);
    const totalXp = xpAgg._sum.amount ?? 0;
    const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
    const nextLevelXp = level * level * 100;
    const allBadges = await this.prisma.db.badge.findMany({ orderBy: { key: "asc" } });

    // Streak: consecutive active days ending today (or yesterday, so a streak survives until
    // the learner misses a full day).
    const activeDays = new Set(events.map((e) => dayKey(e.createdAt)));
    let streak = 0;
    let cursor = new Date();
    if (!activeDays.has(dayKey(cursor))) cursor = new Date(cursor.getTime() - DAY);
    while (activeDays.has(dayKey(cursor))) {
      streak++;
      cursor = new Date(cursor.getTime() - DAY);
    }

    // This week's active days (Mon..Sun) for the streak calendar.
    const now = new Date();
    const monday = new Date(now.getTime() - ((now.getUTCDay() + 6) % 7) * DAY);
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday.getTime() + i * DAY);
      return { day: "MTWTFSS"[i], date: dayKey(d), active: activeDays.has(dayKey(d)), isToday: dayKey(d) === dayKey(now) };
    });

    return {
      totalXp,
      level,
      nextLevelXp,
      xpThisWeek: weekAgg._sum.amount ?? 0,
      streak,
      week,
      badges: allBadges.map((b) => ({
        key: b.key, name: b.name, description: b.description, icon: b.icon,
        earned: earned.some((e) => e.badgeId === b.id),
      })),
      badgesEarned: earned.length,
      badgesTotal: allBadges.length,
    };
  }

  /** Org leaderboard by XP earned in the window (default: this month). */
  async leaderboard(days = 30, take = 10) {
    const { tenantId } = getTenantContext();
    const grouped = await this.prisma.db.xpEvent.groupBy({
      by: ["userId"],
      where: { tenantId, createdAt: { gte: new Date(Date.now() - days * DAY) } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take,
    });
    const users = await this.prisma.db.user.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
      select: { id: true, firstName: true, lastName: true },
    });
    const nameOf = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));
    return grouped.map((g, i) => ({
      rank: i + 1,
      userId: g.userId,
      name: nameOf.get(g.userId) ?? "Unknown",
      xp: g._sum.amount ?? 0,
    }));
  }

  /** Badge rules, re-evaluated after every award. Cheap counts; idempotent via unique index. */
  private async checkBadges(userId: string) {
    const { tenantId } = getTenantContext();
    const [completed, posts, upvotedAgg, profile] = await Promise.all([
      this.prisma.db.enrollment.count({ where: { tenantId, userId, status: "completed" } }),
      this.prisma.db.forumThread.count({ where: { tenantId, authorId: userId } }),
      this.prisma.db.forumThread.aggregate({ where: { tenantId, authorId: userId }, _sum: { upvotes: true } }),
      this.profileStreakOnly(userId),
    ]);
    const award: string[] = [];
    if (completed >= 1) award.push("first-steps");
    if (completed >= 5) award.push("scholar");
    if (posts >= 3) award.push("community-voice");
    if ((upvotedAgg._sum.upvotes ?? 0) >= 10) award.push("helpful");
    if (profile.streak >= 7) award.push("on-fire");

    if (!award.length) return;
    const badges = await this.prisma.db.badge.findMany({ where: { key: { in: award } } });
    for (const b of badges) {
      await this.prisma.db.earnedBadge
        .create({ data: { tenantId, userId, badgeId: b.id } })
        .then(() => this.prisma.db.xpEvent.create({
          data: { tenantId, userId, amount: b.xpReward, reason: "badge", refId: b.key },
        }))
        .catch(() => undefined); // already earned
    }
  }

  private async profileStreakOnly(userId: string) {
    const { tenantId } = getTenantContext();
    const events = await this.prisma.db.activityEvent.findMany({
      where: { tenantId, userId, createdAt: { gte: new Date(Date.now() - 30 * DAY) } },
      select: { createdAt: true },
    });
    const activeDays = new Set(events.map((e) => dayKey(e.createdAt)));
    let streak = 0;
    let cursor = new Date();
    if (!activeDays.has(dayKey(cursor))) cursor = new Date(cursor.getTime() - DAY);
    while (activeDays.has(dayKey(cursor))) {
      streak++;
      cursor = new Date(cursor.getTime() - DAY);
    }
    return { streak };
  }
}
