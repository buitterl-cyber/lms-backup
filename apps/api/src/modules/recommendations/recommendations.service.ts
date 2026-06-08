import { Injectable } from "@nestjs/common";
import { getTenantContext } from "@riyada/shared";
import {
  analyzeSkillGap,
  recommendCourses,
  type CourseLite,
  type RoleRequirement,
  type UserSkill,
} from "@riyada/intelligence";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gap-driven course recommendations for a user against their (target or current) role.
   * Computes the gap, ranks catalog courses that close it, and persists explainable
   * Recommendation rows. This is the core "what should they learn, and why" answer.
   */
  async generateForUser(userId: string, roleId?: string) {
    const { tenantId } = getTenantContext();

    const user = await this.prisma.db.user.findFirst({ where: { id: userId, tenantId } });
    const targetRoleId = roleId ?? user?.targetRoleId ?? user?.currentRoleId ?? undefined;
    if (!targetRoleId) return { recommendations: [] };

    const role = await this.prisma.db.jobRole.findUnique({
      where: { id: targetRoleId },
      include: { requirements: true },
    });
    if (!role) return { recommendations: [] };

    const userSkills = await this.prisma.db.userSkill.findMany({ where: { userId } });
    const courses = await this.prisma.db.course.findMany({
      where: { tenantId },
      include: { skills: true },
    });

    const requirements: RoleRequirement[] = role.requirements.map((r) => ({
      skillId: r.skillId,
      targetLevel: r.targetLevel as RoleRequirement["targetLevel"],
      importance: r.importance as RoleRequirement["importance"],
    }));
    const have: UserSkill[] = userSkills.map((u) => ({ skillId: u.skillId, level: u.level as UserSkill["level"] }));
    const catalog: CourseLite[] = courses.map((c) => ({
      id: c.id,
      title: c.title,
      providerKey: c.providerKey,
      durationMinutes: c.durationMinutes ?? undefined,
      skills: c.skills.map((s) => ({ skillId: s.skillId, confidence: s.confidence })),
    }));

    const { gaps } = analyzeSkillGap(requirements, have);
    const recs = recommendCourses(gaps, catalog, { limit: 10 });

    // Persist with explainable reason (idempotent-ish: replace pending recos for this user)
    await this.prisma.db.recommendation.deleteMany({ where: { tenantId, userId, status: "pending" } });
    if (recs.length) {
      await this.prisma.db.recommendation.createMany({
        data: recs.map((r) => ({
          tenantId,
          userId,
          kind: "skill_gap",
          subjectType: "course",
          subjectId: r.courseId,
          reason: r.reason,
          score: r.score,
          status: "pending",
        })),
      });
    }
    return { roleId: targetRoleId, recommendations: recs };
  }

  async listForUser(userId: string) {
    const { tenantId } = getTenantContext();
    return this.prisma.db.recommendation.findMany({
      where: { tenantId, userId, status: "pending" },
      orderBy: { score: "desc" },
    });
  }

  async accept(id: string) {
    const { tenantId, userId } = getTenantContext();
    const rec = await this.prisma.db.recommendation.update({
      where: { id },
      data: { status: "accepted" },
    });
    // accepting a course reco auto-creates an enrollment
    if (rec.subjectType === "course") {
      await this.prisma.db.enrollment.upsert({
        where: { userId_courseId: { userId: rec.userId, courseId: rec.subjectId } },
        update: {},
        create: {
          tenantId,
          userId: rec.userId,
          courseId: rec.subjectId,
          assignedBy: userId ?? "self",
          assignedReason: rec.reason,
          status: "enrolled",
        },
      });
    }
    return rec;
  }
}
