import { Injectable } from "@nestjs/common";
import { ForbiddenError, getTenantContext, NotFoundError } from "@riyada/shared";
import { PrismaService } from "../../common/prisma/prisma.service";
import { GamificationService } from "../gamification/gamification.service";

/**
 * Instructor portal (wireframe "Instructor View") + native course authoring.
 * Native courses are providerKey="native" with ordered CourseModules; learner progress is
 * per-module with sequential unlock, and enrollment.percent derives from modules completed.
 */
@Injectable()
export class InstructorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
  ) {}

  async overview() {
    const { tenantId } = getTenantContext();
    const [enrollGroups, reviews, unanswered, feedback, courses] = await Promise.all([
      this.prisma.db.enrollment.groupBy({
        by: ["courseId"], where: { tenantId }, _count: { id: true }, _avg: { percent: true, score: true },
      }),
      this.prisma.db.courseReview.groupBy({
        by: ["courseId"], where: { tenantId }, _avg: { rating: true },
      }),
      this.prisma.db.forumThread.count({ where: { tenantId, answeredReplyId: null } }),
      this.prisma.db.courseReview.findMany({
        where: { tenantId, comment: { not: null } },
        orderBy: { createdAt: "desc" }, take: 6,
      }),
      this.prisma.db.course.findMany({
        where: { tenantId, enrollments: { some: {} } },
        select: { id: true, title: true, providerKey: true },
      }),
    ]);
    const posts = await this.prisma.db.forumThread.groupBy({
      by: ["courseId"], where: { tenantId }, _count: { id: true },
    });
    const ratingOf = new Map(reviews.map((r) => [r.courseId, r._avg.rating ?? 0]));
    const postsOf = new Map(posts.map((p) => [p.courseId, p._count.id]));
    const titleOf = new Map(courses.map((c) => [c.id, c.title]));
    const feedbackCourses = await this.prisma.db.course.findMany({
      where: { id: { in: feedback.map((f) => f.courseId) } }, select: { id: true, title: true },
    });
    const fbTitle = new Map(feedbackCourses.map((c) => [c.id, c.title]));

    const performance = enrollGroups
      .filter((g) => titleOf.has(g.courseId))
      .map((g) => ({
        courseId: g.courseId,
        title: titleOf.get(g.courseId)!,
        enrolled: g._count.id,
        completion: Math.round(g._avg.percent ?? 0),
        avgScore: g._avg.score ? Math.round(g._avg.score) : null,
        rating: ratingOf.has(g.courseId) ? Math.round((ratingOf.get(g.courseId) ?? 0) * 10) / 10 : null,
        forumPosts: postsOf.get(g.courseId) ?? 0,
      }))
      .sort((a, b) => b.enrolled - a.enrolled);

    return {
      totalLearners: enrollGroups.reduce((s, g) => s + g._count.id, 0),
      avgRating: reviews.length
        ? Math.round((reviews.reduce((s, r) => s + (r._avg.rating ?? 0), 0) / reviews.length) * 10) / 10
        : null,
      unansweredPosts: unanswered,
      performance,
      recentFeedback: feedback.map((f) => ({
        comment: f.comment,
        rating: f.rating,
        course: fbTitle.get(f.courseId) ?? "Unknown course",
        anonymous: f.anonymous,
      })),
    };
  }

  // --- Authoring ---

  async createCourse(input: { title: string; description: string; level?: string; durationMinutes?: number }) {
    const { tenantId } = getTenantContext();
    return this.prisma.db.course.create({
      data: {
        tenantId,
        providerKey: "native",
        externalId: `native-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        title: input.title,
        description: input.description,
        level: input.level,
        durationMinutes: input.durationMinutes,
        publisher: "In-house",
        isInternal: true,
      },
    });
  }

  async addModule(courseId: string, input: { title: string; summary?: string; durationMinutes?: number; content?: string; position?: number }) {
    const { tenantId } = getTenantContext();
    const course = await this.prisma.db.course.findFirst({ where: { id: courseId, tenantId } });
    if (!course) throw new NotFoundError("Course", courseId);
    const last = await this.prisma.db.courseModule.findFirst({
      where: { courseId }, orderBy: { position: "desc" },
    });
    return this.prisma.db.courseModule.create({
      data: {
        tenantId, courseId,
        position: input.position ?? (last?.position ?? 0) + 1,
        title: input.title, summary: input.summary,
        durationMinutes: input.durationMinutes, content: input.content,
      },
    });
  }

  // --- Learner-facing module progression (sequential unlock) ---

  async modulesForLearner(courseId: string, learnerId: string) {
    const { tenantId } = getTenantContext();
    const modules = await this.prisma.db.courseModule.findMany({
      where: { tenantId, courseId }, orderBy: { position: "asc" },
    });
    const done = await this.prisma.db.moduleProgress.findMany({
      where: { tenantId, userId: learnerId, moduleId: { in: modules.map((m) => m.id) } },
    });
    const doneIds = new Set(done.map((d) => d.moduleId));
    // Sequential unlock: a module is unlocked when every earlier position is complete.
    let unlockedThrough = 0;
    for (const m of modules) {
      if (doneIds.has(m.id)) unlockedThrough = m.position;
      else break;
    }
    return modules.map((m) => ({
      id: m.id,
      position: m.position,
      title: m.title,
      summary: m.summary,
      durationMinutes: m.durationMinutes,
      content: m.position <= unlockedThrough + 1 ? m.content : null,
      completed: doneIds.has(m.id),
      locked: m.position > unlockedThrough + 1,
    }));
  }

  async completeModule(moduleId: string) {
    const { tenantId, userId } = getTenantContext();
    if (!userId) throw new ForbiddenError("enrollment:read");
    const mod = await this.prisma.db.courseModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundError("CourseModule", moduleId);

    // Enforce sequential unlock server-side.
    const earlier = await this.prisma.db.courseModule.findMany({
      where: { tenantId, courseId: mod.courseId, position: { lt: mod.position } },
      select: { id: true },
    });
    if (earlier.length) {
      const done = await this.prisma.db.moduleProgress.count({
        where: { tenantId, userId, moduleId: { in: earlier.map((e) => e.id) } },
      });
      if (done < earlier.length) throw new ForbiddenError("enrollment:read");
    }

    await this.prisma.db.moduleProgress
      .create({ data: { tenantId, userId, moduleId } })
      .catch(() => undefined); // already complete — idempotent

    await this.gamification.recordActivity(userId, "module_completed", moduleId);
    await this.gamification.award(userId, "module_completed", moduleId);

    // Derive enrollment percent from module progress for native courses.
    const [total, done] = await Promise.all([
      this.prisma.db.courseModule.count({ where: { tenantId, courseId: mod.courseId } }),
      this.prisma.db.moduleProgress.count({
        where: {
          tenantId, userId,
          module: { courseId: mod.courseId },
        },
      }),
    ]);
    const percent = total ? Math.round((done / total) * 100) : 0;
    const enrollment = await this.prisma.db.enrollment.findFirst({
      where: { tenantId, userId, courseId: mod.courseId },
    });
    if (enrollment) {
      await this.prisma.db.enrollment.update({
        where: { id: enrollment.id },
        data: {
          percent,
          status: percent >= 100 ? "completed" : "in-progress",
          completedAt: percent >= 100 ? new Date() : null,
        },
      });
      if (percent >= 100) {
        await this.gamification.recordActivity(userId, "course_completed", mod.courseId);
        await this.gamification.award(userId, "course_completed", mod.courseId);
      }
    }
    return { completed: true, percent, courseId: mod.courseId };
  }
}
