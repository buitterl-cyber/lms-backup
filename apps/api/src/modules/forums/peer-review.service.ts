import { Injectable } from "@nestjs/common";
import { ForbiddenError, getTenantContext, NotFoundError } from "@riyada/shared";
import { PrismaService } from "../../common/prisma/prisma.service";
import { GamificationService } from "../gamification/gamification.service";

/** Peer/instructor review queue (wireframe "Peer Review Queue"): learners submit work against a
 *  course; instructors (or peers) claim and grade it. */
@Injectable()
export class PeerReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
  ) {}

  async submit(input: { courseId?: string; title: string; content: string }) {
    const { tenantId, userId } = getTenantContext();
    if (!userId) throw new ForbiddenError("ai:use");
    const review = await this.prisma.db.peerReview.create({
      data: { tenantId, courseId: input.courseId, title: input.title, content: input.content, submitterId: userId },
    });
    await this.gamification.recordActivity(userId, "assessment", review.id);
    return review;
  }

  async queue(status = "pending") {
    const { tenantId } = getTenantContext();
    const items = await this.prisma.db.peerReview.findMany({
      where: { tenantId, status },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    const users = await this.prisma.db.user.findMany({
      where: { id: { in: items.map((i) => i.submitterId) } },
      select: { id: true, firstName: true, lastName: true },
    });
    const courses = await this.prisma.db.course.findMany({
      where: { id: { in: items.map((i) => i.courseId).filter(Boolean) as string[] } },
      select: { id: true, title: true },
    });
    const nameOf = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));
    const courseOf = new Map(courses.map((c) => [c.id, c.title]));
    return items.map((i) => ({
      id: i.id,
      title: i.title,
      content: i.content,
      submitter: nameOf.get(i.submitterId) ?? "Unknown",
      course: i.courseId ? courseOf.get(i.courseId) ?? null : null,
      status: i.status,
      feedback: i.feedback,
      score: i.score,
      createdAt: i.createdAt,
    }));
  }

  async review(id: string, input: { feedback: string; score?: number }) {
    const { tenantId, userId } = getTenantContext();
    const item = await this.prisma.db.peerReview.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundError("PeerReview", id);
    const updated = await this.prisma.db.peerReview.update({
      where: { id },
      data: { status: "reviewed", reviewerId: userId, feedback: input.feedback, score: input.score, reviewedAt: new Date() },
    });
    await this.prisma.db.notification.create({
      data: {
        tenantId, userId: item.submitterId, channel: "in_app", kind: "peer_review",
        payload: { title: item.title, score: input.score ?? null },
      },
    }).catch(() => undefined);
    return updated;
  }
}
