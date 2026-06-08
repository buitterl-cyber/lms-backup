import { Injectable } from "@nestjs/common";
import { prisma } from "@riyada/database";

/**
 * Demo bootstrap. Returns the ids of the first seeded tenant so the UI can render LIVE data
 * before auth/Keycloak sessions are wired. Queries Prisma directly (no tenant context — this is
 * the pre-auth bootstrap). NOT for production multi-tenant use: remove once real sessions resolve
 * the current user/tenant from the verified JWT.
 */
@Injectable()
export class DemoService {
  async context() {
    const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
    if (!tenant) return null;
    const org = await prisma.organization.findFirst({ where: { tenantId: tenant.id } });
    const user = await prisma.user.findFirst({ where: { tenantId: tenant.id }, orderBy: { createdAt: "asc" } });
    return {
      tenantId: tenant.id,
      organizationId: org?.id ?? "",
      userId: user?.id ?? "",
      userName: user ? `${user.firstName} ${user.lastName}` : "",
      jobTitle: user?.jobTitle ?? "",
      departmentId: user?.departmentId ?? "",
      currentRoleId: user?.currentRoleId ?? "",
      targetRoleId: user?.targetRoleId ?? user?.currentRoleId ?? "",
    };
  }
}
