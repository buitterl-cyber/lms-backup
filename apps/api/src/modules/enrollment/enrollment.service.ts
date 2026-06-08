import { Injectable } from "@nestjs/common";
import { getTenantContext, NotFoundError } from "@riyada/shared";
import { PrismaService } from "../../common/prisma/prisma.service";

/**
 * LMS enrollment + progress. Completing a course levels up the learner's skills (course->skills),
 * which is what makes readiness/gap/compliance recompute downstream. In production the completion
 * emits `enrollment.completed`; here we apply the skill level-up inline.
 */
@Injectable()
export class EnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  async enroll(input: { userId: string; courseId: string; assignedReason?: string }) {
    const { tenantId, userId: actor } = getTenantContext();
    return this.prisma.db.enrollment.upsert({
      where: { userId_courseId: { userId: input.userId, courseId: input.courseId } },
      update: {},
      create: {
        tenantId,
        userId: input.userId,
        courseId: input.courseId,
        assignedBy: actor ?? "self",
        assignedReason: input.assignedReason,
        status: "enrolled",
      },
    });
  }

  async setProgress(enrollmentId: string, percent: number, score?: number) {
    const { tenantId } = getTenantContext();
    const enrollment = await this.prisma.db.enrollment.findFirst({ where: { id: enrollmentId, tenantId } });
    if (!enrollment) throw new NotFoundError("Enrollment", enrollmentId);

    const completed = percent >= 100;
    const updated = await this.prisma.db.enrollment.update({
      where: { id: enrollmentId },
      data: {
        percent: Math.min(100, Math.max(0, percent)),
        score,
        status: completed ? "completed" : "in-progress",
        completedAt: completed ? new Date() : null,
      },
    });

    if (completed) await this.levelUpSkills(enrollment.userId, enrollment.courseId);
    return updated;
  }

  /** On completion, raise the learner's level for each skill the course teaches. */
  private async levelUpSkills(userId: string, courseId: string) {
    const courseSkills = await this.prisma.db.courseSkill.findMany({ where: { courseId } });
    for (const cs of courseSkills) {
      const existing = await this.prisma.db.userSkill.findUnique({
        where: { userId_skillId: { userId, skillId: cs.skillId } },
      });
      const nextLevel = Math.min(5, (existing?.level ?? 0) + 1);
      await this.prisma.db.userSkill.upsert({
        where: { userId_skillId: { userId, skillId: cs.skillId } },
        update: { level: nextLevel, source: "inferred", verifiedAt: new Date() },
        create: { userId, skillId: cs.skillId, level: nextLevel, source: "inferred", verifiedAt: new Date() },
      });
    }
  }

  async listForUser(userId: string) {
    const { tenantId } = getTenantContext();
    return this.prisma.db.enrollment.findMany({
      where: { tenantId, userId },
      include: { course: { select: { title: true, providerKey: true } } },
      orderBy: { enrolledAt: "desc" },
    });
  }
}
