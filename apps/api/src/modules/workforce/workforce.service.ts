import { Injectable } from "@nestjs/common";
import { getTenantContext, NotFoundError } from "@riyada/shared";
import { analyzeWorkforce, type RoleRequirement, type TeamMemberProfile } from "@riyada/intelligence";
import { PrismaService } from "../../common/prisma/prisma.service";

/**
 * Workforce planning — org-level skills intelligence for a department against a target role:
 * aggregate shortages (training priorities), succession risk (single points of failure), and
 * who's already ready. Powers the manager + platform dashboards.
 */
@Injectable()
export class WorkforceService {
  constructor(private readonly prisma: PrismaService) {}

  async departmentReadiness(departmentId: string, roleId: string) {
    const { tenantId } = getTenantContext();

    const role = await this.prisma.db.jobRole.findUnique({
      where: { id: roleId },
      include: { requirements: { include: { skill: true } } },
    });
    if (!role) throw new NotFoundError("JobRole", roleId);

    const users = await this.prisma.db.user.findMany({
      where: { tenantId, departmentId },
      include: { userSkills: true },
    });

    const requirements: RoleRequirement[] = role.requirements.map((r) => ({
      skillId: r.skillId,
      targetLevel: r.targetLevel as RoleRequirement["targetLevel"],
      importance: r.importance as RoleRequirement["importance"],
    }));
    const team: TeamMemberProfile[] = users.map((u) => ({
      userId: u.id,
      skills: u.userSkills.map((s) => ({ skillId: s.skillId, level: s.level as TeamMemberProfile["skills"][number]["level"] })),
    }));

    const analysis = analyzeWorkforce(requirements, team);
    const nameById = new Map(role.requirements.map((r) => [r.skillId, r.skill.name]));

    return {
      departmentId,
      roleId,
      roleName: role.name,
      teamSize: analysis.teamSize,
      avgCoverage: analysis.avgCoverage,
      readyForRole: analysis.readyForRole.length,
      shortages: analysis.shortages.map((s) => ({ ...s, name: nameById.get(s.skillId) ?? s.skillId })),
      singlePointsOfFailure: analysis.singlePointsOfFailure.map((id) => nameById.get(id) ?? id),
    };
  }
}
