import { Injectable } from "@nestjs/common";
import { getTenantContext } from "@riyada/shared";
import { ROLE_PERMISSIONS, type UserRoleKey } from "@riyada/shared";
import { PrismaService } from "../../common/prisma/prisma.service";

/** Org hierarchy + user lifecycle + RBAC assignment. Identity itself is federated to Keycloak;
 *  this owns the platform-side profile, org tree, and role grants. */
@Injectable()
export class IdentityService {
  constructor(private readonly prisma: PrismaService) {}

  async inviteUser(input: { email: string; firstName: string; lastName: string; departmentId?: string; role?: UserRoleKey }) {
    const { tenantId, organizationId } = getTenantContext();
    const user = await this.prisma.db.user.upsert({
      where: { organizationId_email: { organizationId, email: input.email } },
      update: { firstName: input.firstName, lastName: input.lastName, departmentId: input.departmentId },
      create: {
        tenantId,
        organizationId,
        departmentId: input.departmentId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        status: "invited",
      },
    });
    if (input.role) await this.assignRole(user.id, input.role);
    return { id: user.id, email: user.email, status: user.status };
  }

  async assignRole(userId: string, roleKey: UserRoleKey, scope?: { type: "organization" | "department" | "team"; id: string }) {
    const { tenantId, organizationId } = getTenantContext();
    const role = await this.prisma.db.role.upsert({
      where: { tenantId_organizationId_key: { tenantId, organizationId, key: roleKey } },
      update: {},
      create: { tenantId, organizationId, key: roleKey, name: roleKey, permissions: ROLE_PERMISSIONS[roleKey] },
    });
    return this.prisma.db.roleAssignment.upsert({
      where: { userId_roleId_scopeType_scopeId: { userId, roleId: role.id, scopeType: scope?.type ?? "organization", scopeId: scope?.id ?? "" } },
      update: {},
      create: { userId, roleId: role.id, scopeType: scope?.type ?? "organization", scopeId: scope?.id ?? "" },
    });
  }

  async createDepartment(name: string, divisionId?: string) {
    const { tenantId, organizationId } = getTenantContext();
    return this.prisma.db.department.create({ data: { tenantId, organizationId, name, divisionId } });
  }

  async listUsers() {
    const { tenantId, organizationId } = getTenantContext();
    return this.prisma.db.user.findMany({
      where: { tenantId, organizationId },
      select: { id: true, email: true, firstName: true, lastName: true, jobTitle: true, status: true, departmentId: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
