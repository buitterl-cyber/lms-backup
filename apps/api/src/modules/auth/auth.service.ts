import { Injectable } from "@nestjs/common";
import { DomainError } from "@riyada/shared";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../../common/prisma/prisma.service";

const secret = () => process.env.JWT_SECRET || "dev-insecure-secret";

export interface JwtClaims {
  sub: string;
  tenantId: string;
  organizationId: string;
  roles: string[];
  name: string;
}

/**
 * App-level email/password auth (for environments without Keycloak). Verifies a bcrypt hash and
 * issues a signed JWT carrying the tenant/org/user/roles — which the TenantMiddleware verifies on
 * every request, replacing the trust-the-header demo path with a verified identity.
 */
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.db.user.findFirst({
      where: { email },
      include: { roleAssignments: { include: { role: true } } },
    });
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new DomainError("Invalid email or password", 401, "invalid_credentials");
    }
    const roles = user.roleAssignments.map((ra) => ra.role.key);
    const claims: JwtClaims = {
      sub: user.id,
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      roles: roles.length ? roles : ["learner"],
      name: `${user.firstName} ${user.lastName}`,
    };
    const token = jwt.sign(claims, secret(), { expiresIn: "12h" });
    // Login is a streak-qualifying activity (no tenant context on this public path — write direct).
    void this.prisma.db.activityEvent
      .create({ data: { tenantId: user.tenantId, userId: user.id, kind: "login" } })
      .catch(() => undefined);
    return { token, user: { id: user.id, email: user.email, name: claims.name, roles: claims.roles } };
  }

  static verify(token: string): JwtClaims {
    return jwt.verify(token, secret()) as JwtClaims;
  }

  /** Same shape as /demo/context (+roles) so the web can use either interchangeably. */
  async me(token: string) {
    let c: JwtClaims;
    try {
      c = AuthService.verify(token);
    } catch {
      // Stale/foreign cookie (e.g. signed with a rotated JWT_SECRET) is a client-state problem,
      // not a server error: 401 so the web can fall back to the demo context instead of dying.
      throw new DomainError("Invalid or expired token", 401, "invalid_token");
    }
    const user = await this.prisma.db.user.findFirst({
      where: { id: c.sub },
      select: { id: true, firstName: true, lastName: true, jobTitle: true, tenantId: true, organizationId: true, departmentId: true, currentRoleId: true, targetRoleId: true },
    });
    if (!user) throw new DomainError("User not found", 404, "not_found");
    return {
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      jobTitle: user.jobTitle ?? "",
      departmentId: user.departmentId ?? "",
      currentRoleId: user.currentRoleId ?? "",
      targetRoleId: user.targetRoleId ?? user.currentRoleId ?? "",
      roles: c.roles,
    };
  }
}
