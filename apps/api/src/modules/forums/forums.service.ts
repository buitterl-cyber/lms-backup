import { Injectable } from "@nestjs/common";
import { ForbiddenError, getTenantContext, NotFoundError } from "@riyada/shared";
import { PrismaService } from "../../common/prisma/prisma.service";
import { GamificationService } from "../gamification/gamification.service";

/**
 * Per-course discussion forums (wireframe "Course Forum"): threads + replies with upvotes,
 * instructor pinning, anonymous posting, and accepted answers. Posting earns XP.
 */
@Injectable()
export class ForumsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
  ) {}

  /** Users holding an instructor-ish access role — used to badge authors in thread lists. */
  private async instructorIds(userIds: string[]): Promise<Set<string>> {
    if (!userIds.length) return new Set();
    const grants = await this.prisma.db.roleAssignment.findMany({
      where: { userId: { in: userIds }, role: { key: { in: ["instructor", "trainer"] } } },
      select: { userId: true },
    });
    return new Set(grants.map((g) => g.userId));
  }

  private async decorate(authorIds: string[]) {
    const users = await this.prisma.db.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const instructors = await this.instructorIds(authorIds);
    const nameOf = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));
    return { nameOf, instructors };
  }

  async listThreads(courseId: string, filter?: string) {
    const { tenantId, userId } = getTenantContext();
    const where: Record<string, unknown> = { tenantId, courseId };
    if (filter === "pinned") where.pinned = true;
    if (filter === "mine") where.authorId = userId ?? "";
    if (filter === "unanswered") where.answeredReplyId = null;

    const threads = await this.prisma.db.forumThread.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 50,
      include: { _count: { select: { replies: true } } },
    });
    const { nameOf, instructors } = await this.decorate(threads.map((t) => t.authorId));
    return threads.map((t) => ({
      id: t.id,
      title: t.title,
      body: t.body,
      pinned: t.pinned,
      anonymous: t.anonymous,
      answered: !!t.answeredReplyId,
      upvotes: t.upvotes,
      replies: t._count.replies,
      author: t.anonymous ? "Anonymous" : nameOf.get(t.authorId) ?? "Unknown",
      isInstructor: !t.anonymous && instructors.has(t.authorId),
      mine: t.authorId === userId,
      createdAt: t.createdAt,
    }));
  }

  async getThread(id: string) {
    const { tenantId, userId } = getTenantContext();
    const t = await this.prisma.db.forumThread.findFirst({
      where: { id, tenantId },
      include: { replies: { orderBy: { createdAt: "asc" } }, course: { select: { title: true } } },
    });
    if (!t) throw new NotFoundError("ForumThread", id);
    const ids = [t.authorId, ...t.replies.map((r) => r.authorId)];
    const { nameOf, instructors } = await this.decorate(ids);
    return {
      id: t.id,
      courseId: t.courseId,
      courseTitle: t.course.title,
      title: t.title,
      body: t.body,
      pinned: t.pinned,
      upvotes: t.upvotes,
      author: t.anonymous ? "Anonymous" : nameOf.get(t.authorId) ?? "Unknown",
      isInstructor: !t.anonymous && instructors.has(t.authorId),
      createdAt: t.createdAt,
      replies: t.replies.map((r) => ({
        id: r.id,
        body: r.body,
        upvotes: r.upvotes,
        accepted: r.id === t.answeredReplyId,
        author: r.anonymous ? "Anonymous" : nameOf.get(r.authorId) ?? "Unknown",
        isInstructor: !r.anonymous && instructors.has(r.authorId),
        mine: r.authorId === userId,
        createdAt: r.createdAt,
      })),
    };
  }

  async createThread(courseId: string, input: { title: string; body: string; anonymous?: boolean }) {
    const { tenantId, userId } = getTenantContext();
    if (!userId) throw new ForbiddenError("ai:use");
    const thread = await this.prisma.db.forumThread.create({
      data: { tenantId, courseId, authorId: userId, title: input.title, body: input.body, anonymous: !!input.anonymous },
    });
    await this.gamification.recordActivity(userId, "forum_post", thread.id);
    await this.gamification.award(userId, "forum_post", thread.id);
    return thread;
  }

  async reply(threadId: string, input: { body: string; anonymous?: boolean }) {
    const { tenantId, userId } = getTenantContext();
    if (!userId) throw new ForbiddenError("ai:use");
    const thread = await this.prisma.db.forumThread.findFirst({ where: { id: threadId, tenantId } });
    if (!thread) throw new NotFoundError("ForumThread", threadId);
    const reply = await this.prisma.db.forumReply.create({
      data: { tenantId, threadId, authorId: userId, body: input.body, anonymous: !!input.anonymous },
    });
    await this.gamification.recordActivity(userId, "forum_post", reply.id);
    await this.gamification.award(userId, "forum_reply", reply.id);
    // Notify the thread author (in-app) that someone replied.
    if (thread.authorId !== userId) {
      await this.prisma.db.notification.create({
        data: {
          tenantId, userId: thread.authorId, channel: "in_app", kind: "forum_reply",
          payload: { threadId, threadTitle: thread.title },
        },
      }).catch(() => undefined);
    }
    return reply;
  }

  /** One vote per user per target; the counter and the vote row move together. */
  async vote(target: { threadId?: string; replyId?: string }) {
    const { tenantId, userId } = getTenantContext();
    if (!userId) throw new ForbiddenError("ai:use");
    try {
      await this.prisma.db.forumVote.create({
        data: { userId, threadId: target.threadId ?? "", replyId: target.replyId ?? "" },
      });
    } catch {
      return { voted: false, reason: "already voted" };
    }
    let authorId: string | null = null;
    if (target.threadId) {
      const t = await this.prisma.db.forumThread.update({
        where: { id: target.threadId }, data: { upvotes: { increment: 1 } },
      });
      authorId = t.anonymous ? null : t.authorId;
    } else if (target.replyId) {
      const r = await this.prisma.db.forumReply.update({
        where: { id: target.replyId }, data: { upvotes: { increment: 1 } },
      });
      authorId = r.anonymous ? null : r.authorId;
    }
    if (authorId && authorId !== userId) {
      const ctx = getTenantContext();
      await this.prisma.db.xpEvent.create({
        data: { tenantId: ctx.tenantId, userId: authorId, amount: 5, reason: "forum_upvote" },
      }).catch(() => undefined);
    }
    return { voted: true };
  }

  async pin(threadId: string, pinned: boolean) {
    const { tenantId } = getTenantContext();
    const t = await this.prisma.db.forumThread.findFirst({ where: { id: threadId, tenantId } });
    if (!t) throw new NotFoundError("ForumThread", threadId);
    return this.prisma.db.forumThread.update({ where: { id: threadId }, data: { pinned } });
  }

  async accept(threadId: string, replyId: string) {
    const { tenantId } = getTenantContext();
    const t = await this.prisma.db.forumThread.findFirst({ where: { id: threadId, tenantId } });
    if (!t) throw new NotFoundError("ForumThread", threadId);
    return this.prisma.db.forumThread.update({ where: { id: threadId }, data: { answeredReplyId: replyId } });
  }

  /** Rate a course 1..5 (upsert — a learner refines one review). Feeds the manager "Course
   *  Ratings" panel and the instructor "Recent Feedback" list. */
  async rateCourse(courseId: string, input: { rating: number; comment?: string; anonymous?: boolean }) {
    const { tenantId, userId } = getTenantContext();
    if (!userId) throw new ForbiddenError("ai:use");
    const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
    return this.prisma.db.courseReview.upsert({
      where: { courseId_userId: { courseId, userId } },
      update: { rating, comment: input.comment, anonymous: input.anonymous ?? true },
      create: { tenantId, courseId, userId, rating, comment: input.comment, anonymous: input.anonymous ?? true },
    });
  }

  async stats(courseId: string) {
    const { tenantId, userId } = getTenantContext();
    const [total, answered, mine, enrolled] = await Promise.all([
      this.prisma.db.forumThread.count({ where: { tenantId, courseId } }),
      this.prisma.db.forumThread.count({ where: { tenantId, courseId, answeredReplyId: { not: null } } }),
      this.prisma.db.forumThread.count({ where: { tenantId, courseId, authorId: userId ?? "" } }),
      this.prisma.db.enrollment.count({ where: { tenantId, courseId } }),
    ]);
    return { totalPosts: total, answered, answeredPct: total ? Math.round((answered / total) * 100) : 0, myPosts: mine, enrolled };
  }
}
