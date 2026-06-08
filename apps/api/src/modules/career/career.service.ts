import { Injectable } from "@nestjs/common";
import { getTenantContext, NotFoundError } from "@riyada/shared";
import {
  buildCareerPlan,
  type CourseLite,
  type RoleRequirement,
  type Skill,
  type UserSkill,
} from "@riyada/intelligence";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class CareerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate (and persist) a career plan from the user's current skills to a target role:
   * skill gap -> prerequisite-ordered roadmap -> estimated months + cost.
   */
  async createPlan(userId: string, targetRoleId: string) {
    const { tenantId } = getTenantContext();

    const role = await this.prisma.db.jobRole.findUnique({
      where: { id: targetRoleId },
      include: { requirements: true },
    });
    if (!role) throw new NotFoundError("JobRole", targetRoleId);

    const [userSkills, allSkills, courses] = await Promise.all([
      this.prisma.db.userSkill.findMany({ where: { userId } }),
      this.prisma.db.skill.findMany({ where: { OR: [{ tenantId }, { tenantId: null }] }, include: { edgesFrom: true } }),
      this.prisma.db.course.findMany({ where: { tenantId }, include: { skills: true } }),
    ]);

    const requirements: RoleRequirement[] = role.requirements.map((r) => ({
      skillId: r.skillId,
      targetLevel: r.targetLevel as RoleRequirement["targetLevel"],
      importance: r.importance as RoleRequirement["importance"],
    }));
    const have: UserSkill[] = userSkills.map((u) => ({ skillId: u.skillId, level: u.level as UserSkill["level"] }));

    // prerequisite edges: edge kind "prerequisite" from A->B means A is prereq of B
    const prereqByTarget = new Map<string, string[]>();
    for (const s of allSkills) {
      for (const e of s.edgesFrom) {
        if (e.kind === "prerequisite") {
          const arr = prereqByTarget.get(e.toId) ?? [];
          arr.push(e.fromId);
          prereqByTarget.set(e.toId, arr);
        }
      }
    }
    const skills: Skill[] = allSkills.map((s) => ({ id: s.id, name: s.name, prerequisites: prereqByTarget.get(s.id) ?? [] }));

    const catalog: CourseLite[] = courses.map((c) => ({
      id: c.id,
      title: c.title,
      providerKey: c.providerKey,
      durationMinutes: c.durationMinutes ?? undefined,
      skills: c.skills.map((cs) => ({ skillId: cs.skillId, confidence: cs.confidence })),
    }));

    const plan = buildCareerPlan({
      targetRoleId,
      targetRequirements: requirements,
      userSkills: have,
      skills,
      catalog,
    });

    const saved = await this.prisma.db.careerPlan.create({
      data: {
        tenantId,
        userId,
        targetRoleId,
        gapSkillIds: plan.gapSkillIds,
        roadmap: plan.steps as unknown as object,
        estMonths: plan.estMonths,
        estCost: plan.estCostCents / 100,
        status: "active",
      },
    });
    return { id: saved.id, ...plan };
  }
}
