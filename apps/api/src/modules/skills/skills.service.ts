import { Injectable } from "@nestjs/common";
import { getTenantContext, NotFoundError } from "@riyada/shared";
import { analyzeSkillGap, type RoleRequirement, type UserSkill } from "@riyada/intelligence";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  /** A user's inferred skill profile with evidence (explainability). */
  async getUserSkills(userId: string) {
    const { tenantId } = getTenantContext();
    const rows = await this.prisma.db.userSkill.findMany({
      where: { userId, user: { tenantId } },
      include: { skill: true },
    });
    return rows.map((r) => ({
      skillId: r.skillId,
      name: r.skill.name,
      level: r.level,
      source: r.source,
      verifiedAt: r.verifiedAt,
    }));
  }

  /**
   * Skill gap analysis for a user against a target job role. Pulls role requirements + the
   * user's current skills, then delegates the decision to the (pure, tested) intelligence engine.
   */
  async getSkillGap(userId: string, roleId: string) {
    const { tenantId } = getTenantContext();

    const role = await this.prisma.db.jobRole.findFirst({
      where: { id: roleId },
      include: { requirements: { include: { skill: true } } },
    });
    if (!role) throw new NotFoundError("JobRole", roleId);

    const userSkills = await this.prisma.db.userSkill.findMany({
      where: { userId, user: { tenantId } },
    });

    const requirements: RoleRequirement[] = role.requirements.map((r) => ({
      skillId: r.skillId,
      targetLevel: r.targetLevel as RoleRequirement["targetLevel"],
      importance: r.importance as RoleRequirement["importance"],
    }));
    const have: UserSkill[] = userSkills.map((u) => ({
      skillId: u.skillId,
      level: u.level as UserSkill["level"],
    }));

    const result = analyzeSkillGap(requirements, have);

    // hydrate skill names for the UI
    const nameById = new Map(role.requirements.map((r) => [r.skillId, r.skill.name]));
    return {
      roleId,
      roleName: role.name,
      coverage: result.coverage,
      gaps: result.gaps.map((g) => ({ ...g, name: nameById.get(g.skillId) ?? g.skillId })),
    };
  }
}
