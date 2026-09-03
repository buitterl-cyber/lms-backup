import { Injectable } from "@nestjs/common";
import { ForbiddenError, getTenantContext, hasPermission, NotFoundError } from "@riyada/shared";
import { createProvider } from "@riyada/providers";
import { PrismaService } from "../../common/prisma/prisma.service";
import { GamificationService } from "../gamification/gamification.service";
import { decryptProviderCredentials } from "../providers/provider-credentials";

/**
 * LMS enrollment + progress. Completing a course levels up the learner's skills (course->skills),
 * which is what makes readiness/gap/compliance recompute downstream. In production the completion
 * emits `enrollment.completed`; here we apply the skill level-up inline.
 */
@Injectable()
export class EnrollmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
  ) {}

  async enroll(input: { userId: string; courseId: string; assignedReason?: string }) {
    const { tenantId, userId: actor, roles } = getTenantContext();
    // Self-enrollment is every learner's right; enrolling OTHERS is a manager action.
    if (input.userId !== actor && !hasPermission(roles, "enrollment:assign")) {
      throw new ForbiddenError("enrollment:assign");
    }
    const enrollment = await this.prisma.db.enrollment.upsert({
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
    // Provision the learner into the client's external platform (e.g. LearnWorlds) if the course's
    // provider is connected. Fire-and-forget: a misconfigured/offline provider never blocks the
    // local enrolment.
    void this.propagateToProvider(input.userId, input.courseId).catch(() => undefined);
    void this.gamification.recordActivity(input.userId, "course_enrolled", input.courseId).catch(() => undefined);
    return enrollment;
  }

  /** If the course came from a connected provider that supports enrolment, create+enrol the learner
   *  in THAT platform (the "enlist people in their own platform" flow). */
  private async propagateToProvider(userId: string, courseId: string) {
    const { tenantId, organizationId } = getTenantContext();
    const course = await this.prisma.db.course.findFirst({ where: { id: courseId, tenantId } });
    if (!course?.externalId) return;
    const conn = await this.prisma.db.providerConnection.findFirst({
      where: { tenantId, organizationId, providerKey: course.providerKey, status: "active" },
    });
    if (!conn) return;

    const provider = createProvider(conn.providerKey, { tenantId, organizationId, credentials: decryptProviderCredentials(conn.credentialsEnc) });
    if (!provider.descriptor.capabilities.enrollment) return;

    const user = await this.prisma.db.user.findFirst({ where: { id: userId } });
    if (!user) return;

    const externalLearnerId = await this.resolveExternalLearnerId(user, conn.id, provider);
    const ext = await provider.enrollLearner({ externalLearnerId, externalCourseId: course.externalId, idempotencyKey: `${userId}:${courseId}` });
    await this.prisma.db.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: { externalEnrollmentId: ext.externalEnrollmentId },
    });
  }

  /**
   * A learner should exist exactly once per provider connection — calling provider.createLearner()
   * fresh on every enrollment would ask the provider to (re)create the same portal user repeatedly,
   * and there'd be nowhere to look up their external id for later getProgress/getCertificate/
   * getLaunchUrl calls. ProviderLearnerLink caches that mapping the first time, and every
   * subsequent enrollment (into any course on the same connection) reuses it.
   */
  private async resolveExternalLearnerId(
    user: { id: string; email: string; firstName: string; lastName: string; locale: string },
    connectionId: string,
    provider: ReturnType<typeof createProvider>,
  ): Promise<string> {
    const { tenantId } = getTenantContext();
    const existing = await this.prisma.db.providerLearnerLink.findUnique({
      where: { userId_connectionId: { userId: user.id, connectionId } },
    });
    if (existing) return existing.externalLearnerId;

    const { externalLearnerId } = await provider.createLearner({
      internalUserId: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, locale: user.locale,
    });
    await this.prisma.db.providerLearnerLink.upsert({
      where: { userId_connectionId: { userId: user.id, connectionId } },
      update: { externalLearnerId, lastSyncedAt: new Date() },
      create: {
        tenantId, userId: user.id, connectionId, providerKey: provider.descriptor.key,
        externalLearnerId, lastSyncedAt: new Date(),
      },
    });
    return externalLearnerId;
  }

  async setProgress(enrollmentId: string, percent: number, score?: number) {
    const { tenantId, userId: actor, roles } = getTenantContext();
    const enrollment = await this.prisma.db.enrollment.findFirst({ where: { id: enrollmentId, tenantId } });
    if (!enrollment) throw new NotFoundError("Enrollment", enrollmentId);
    // Ownership: a learner moves only their own progress; managers may move anyone's.
    if (enrollment.userId !== actor && !hasPermission(roles, "enrollment:assign")) {
      throw new ForbiddenError("enrollment:assign");
    }

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

    await this.gamification.recordActivity(enrollment.userId, completed ? "course_completed" : "course_progress", enrollment.courseId);
    if (completed) {
      await this.levelUpSkills(enrollment.userId, enrollment.courseId);
      await this.gamification.award(enrollment.userId, "course_completed", enrollment.courseId);
    }
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
      include: { course: { select: { title: true, providerKey: true, durationMinutes: true } } },
      orderBy: { enrolledAt: "desc" },
    });
  }
}
