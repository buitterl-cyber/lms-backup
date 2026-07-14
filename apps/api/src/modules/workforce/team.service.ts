import { Injectable } from "@nestjs/common";
import { getTenantContext, NotFoundError } from "@riyada/shared";
import { PrismaService } from "../../common/prisma/prisma.service";
import { MailerService } from "../../common/mailer/mailer.service";
import { GamificationService } from "../gamification/gamification.service";

const DAY = 86_400_000;

export type LearnerStatus = "on_track" | "falling_behind" | "at_risk" | "not_started";

/**
 * Manager dashboard (wireframe "Manager Portal"): per-learner progress + status, alerts,
 * KPIs, activity heatmap — and the Nudge action (in-app + email reminder).
 */
@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly gamification: GamificationService,
  ) {}

  async dashboard() {
    const { tenantId, organizationId } = getTenantContext();
    const now = Date.now();

    const users = await this.prisma.db.user.findMany({
      where: { tenantId, organizationId, status: "active" },
      include: { enrollments: { include: { course: { select: { title: true } } }, orderBy: { enrolledAt: "desc" } } },
    });
    const userIds = users.map((u) => u.id);

    const [lastEvents, heatEvents, certsQ, reviews] = await Promise.all([
      this.prisma.db.activityEvent.groupBy({
        by: ["userId"], where: { tenantId, userId: { in: userIds } }, _max: { createdAt: true },
      }),
      this.prisma.db.activityEvent.findMany({
        where: { tenantId, createdAt: { gte: new Date(now - 84 * DAY) } },
        select: { createdAt: true },
      }),
      this.prisma.db.earnedCertificate.count({
        where: { tenantId, issuedAt: { gte: new Date(now - 90 * DAY) } },
      }),
      this.prisma.db.courseReview.groupBy({
        by: ["courseId"], where: { tenantId }, _avg: { rating: true }, _count: { rating: true },
      }),
    ]);
    const lastActive = new Map(lastEvents.map((e) => [e.userId, e._max.createdAt as Date]));

    const learners = users.map((u) => {
      const active =
        u.enrollments.find((e) => e.status === "in-progress") ??
        // A deadlined, unfinished assignment is the most managerially relevant "active" course.
        u.enrollments.find((e) => e.status === "enrolled" && e.dueAt && e.percent < 100) ??
        u.enrollments.find((e) => e.status === "enrolled") ??
        u.enrollments[0];
      const la = lastActive.get(u.id) ?? null;
      const idleDays = la ? Math.floor((now - la.getTime()) / DAY) : null;
      const overdue = active?.dueAt ? active.dueAt.getTime() < now && active.percent < 100 : false;
      const dueSoon = active?.dueAt ? active.dueAt.getTime() - now < 5 * DAY && active.percent < 100 : false;

      let status: LearnerStatus = "on_track";
      if ((idleDays ?? 0) >= 7 || (dueSoon && (active?.percent ?? 0) < 50)) status = "falling_behind";
      if ((idleDays ?? 0) >= 14 || overdue) status = "at_risk";
      // "Not Started" wins: it's its own wireframe status and drives the deadline alert.
      if (active && active.percent === 0 && active.status !== "completed") status = "not_started";

      return {
        userId: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        activeCourse: active?.course?.title ?? null,
        activeCourseId: active?.courseId ?? null,
        percent: active?.percent ?? null,
        started: (active?.percent ?? 0) > 0 || active?.status === "in-progress" || active?.status === "completed",
        dueAt: active?.dueAt ?? null,
        lastActiveAt: la,
        status,
      };
    });

    // Alerts (wireframe: "3 learners haven't started X — deadline in 5 days" / "N weeks behind").
    const alerts: { kind: string; text: string; userIds: string[]; courseId?: string }[] = [];
    const notStartedDue = learners.filter((l) => l.status === "not_started" && l.dueAt);
    if (notStartedDue.length) {
      const byCourse = new Map<string, typeof notStartedDue>();
      for (const l of notStartedDue) {
        const arr = byCourse.get(l.activeCourse!) ?? [];
        arr.push(l);
        byCourse.set(l.activeCourse!, arr);
      }
      for (const [course, ls] of byCourse) {
        const days = Math.max(0, Math.ceil((new Date(ls[0].dueAt!).getTime() - now) / DAY));
        alerts.push({
          kind: "deadline",
          text: `${ls.length} learner${ls.length > 1 ? "s" : ""} haven't started "${course}" — deadline in ${days} day${days === 1 ? "" : "s"}.`,
          userIds: ls.map((l) => l.userId),
          courseId: ls[0].activeCourseId ?? undefined,
        });
      }
    }
    for (const l of learners.filter((x) => x.status === "at_risk" && x.lastActiveAt)) {
      const weeks = Math.floor((now - new Date(l.lastActiveAt!).getTime()) / (7 * DAY));
      if (weeks >= 1)
        alerts.push({ kind: "behind", text: `${l.name} is ${weeks} week${weeks > 1 ? "s" : ""} behind on their learning path.`, userIds: [l.userId] });
    }

    // KPIs — deltas only where real history exists (no fabricated trends):
    // courses assigned this month vs last (enrolledAt), certs this 90d vs prior 90d, and
    // avg active days/week this month vs last (activity events). Completion has no
    // historical snapshot yet, so it ships without a delta.
    const allEnrollments = users.flatMap((u) => u.enrollments);
    const MONTH = 30 * DAY;
    const [assignedThisMonth, assignedLastMonth, certsPrev, actThisMonth, actLastMonth] = await Promise.all([
      this.prisma.db.enrollment.count({ where: { tenantId, enrolledAt: { gte: new Date(now - MONTH) } } }),
      this.prisma.db.enrollment.count({ where: { tenantId, enrolledAt: { gte: new Date(now - 2 * MONTH), lt: new Date(now - MONTH) } } }),
      this.prisma.db.earnedCertificate.count({ where: { tenantId, issuedAt: { gte: new Date(now - 180 * DAY), lt: new Date(now - 90 * DAY) } } }),
      this.prisma.db.activityEvent.findMany({
        where: { tenantId, createdAt: { gte: new Date(now - MONTH) } }, select: { userId: true, createdAt: true },
      }),
      this.prisma.db.activityEvent.findMany({
        where: { tenantId, createdAt: { gte: new Date(now - 2 * MONTH), lt: new Date(now - MONTH) } }, select: { userId: true, createdAt: true },
      }),
    ]);
    const activeDaysPerWeek = (events: { userId: string; createdAt: Date }[]) => {
      if (!users.length) return 0;
      const days = new Set(events.map((e) => `${e.userId}:${e.createdAt.toISOString().slice(0, 10)}`));
      return Math.round((days.size / users.length / (MONTH / (7 * DAY))) * 10) / 10;
    };
    const avgActiveDays = activeDaysPerWeek(actThisMonth);
    const avgActiveDaysPrev = activeDaysPerWeek(actLastMonth);

    const kpis = {
      coursesAssigned: allEnrollments.length,
      coursesAssignedDelta: assignedThisMonth - assignedLastMonth,
      avgCompletion: allEnrollments.length
        ? Math.round(allEnrollments.reduce((s, e) => s + e.percent, 0) / allEnrollments.length)
        : 0,
      avgActiveDays,
      avgActiveDaysDelta: Math.round((avgActiveDays - avgActiveDaysPrev) * 10) / 10,
      certsEarned: certsQ,
      certsEarnedDelta: certsQ - certsPrev,
      teamSize: users.length,
    };

    // Heatmap: 12 weeks x 7 days activity counts.
    const heat: number[][] = Array.from({ length: 12 }, () => Array(7).fill(0));
    for (const e of heatEvents) {
      const age = Math.floor((now - e.createdAt.getTime()) / DAY);
      const week = 11 - Math.floor(age / 7);
      if (week >= 0 && week < 12) heat[week][6 - (age % 7)]++;
    }

    // Course ratings panel
    const courses = await this.prisma.db.course.findMany({
      where: { id: { in: reviews.map((r) => r.courseId) } },
      select: { id: true, title: true },
    });
    const titleOf = new Map(courses.map((c) => [c.id, c.title]));
    const ratings = reviews
      .map((r) => ({
        courseId: r.courseId,
        title: titleOf.get(r.courseId) ?? r.courseId,
        rating: Math.round((r._avg.rating ?? 0) * 10) / 10,
        count: r._count.rating,
      }))
      .sort((a, b) => b.rating - a.rating);

    const leaderboard = await this.gamification.leaderboard(30, 5);

    return { kpis, learners, alerts, heatmap: heat, ratings, leaderboard };
  }

  /**
   * Nudge = Carl's #1 ask: remind a learner in-app AND by email. `system` sender = auto-nudge.
   * Dedupe: skip when the same (learner, course, kind) was nudged within 7 days.
   */
  async nudge(input: { learnerId: string; courseId?: string; message?: string; kind?: string; senderId?: string }) {
    const { tenantId, userId } = getTenantContext();
    const senderId = input.senderId ?? userId ?? "system";
    const kind = input.kind ?? "manual";

    const recent = await this.prisma.db.nudge.findFirst({
      where: {
        tenantId, learnerId: input.learnerId, courseId: input.courseId ?? null, kind,
        createdAt: { gte: new Date(Date.now() - 7 * DAY) },
      },
    });
    if (recent && kind !== "manual") return { skipped: true, reason: "nudged recently" };

    const learner = await this.prisma.db.user.findFirst({ where: { id: input.learnerId, tenantId } });
    if (!learner) throw new NotFoundError("User", input.learnerId);
    const course = input.courseId
      ? await this.prisma.db.course.findFirst({ where: { id: input.courseId, tenantId } })
      : null;

    const enrollment = course
      ? await this.prisma.db.enrollment.findFirst({ where: { tenantId, userId: learner.id, courseId: course.id } })
      : null;
    const dueTxt = enrollment?.dueAt
      ? ` It's due ${enrollment.dueAt.toISOString().slice(0, 10)}.`
      : "";
    const defaultMsg = course
      ? `Friendly reminder to continue "${course.title}".${dueTxt} A little progress each day keeps you on track!`
      : "Friendly reminder to continue your learning path — you have courses waiting.";
    const message = input.message || defaultMsg;

    await this.prisma.db.nudge.create({
      data: { tenantId, learnerId: learner.id, courseId: course?.id, senderId, kind, message },
    });
    await this.prisma.db.notification.create({
      data: {
        tenantId, userId: learner.id, channel: "in_app", kind: "nudge",
        payload: { message, courseId: course?.id ?? null, courseTitle: course?.title ?? null, from: senderId },
      },
    });
    const emailed = await this.mailer.send(
      learner.email,
      course ? `Reminder: continue "${course.title}"` : "Reminder from your learning platform",
      `<p>Hi ${learner.firstName},</p><p>${message}</p>
       <p><a href="${process.env.WEB_URL || "https://lms.excisone.com"}/my-learning">Open My Learning →</a></p>
       <p style="color:#888;font-size:12px">Sent via the LMS nudge feature.</p>`,
    );
    return { nudged: true, inApp: true, emailed };
  }
}
