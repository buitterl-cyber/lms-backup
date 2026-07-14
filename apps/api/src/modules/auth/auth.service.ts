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

  /** Email/password signup: new learner in the default tenant/org, logged in immediately.
   *  Disable by setting SIGNUP_ENABLED=false. */
  async signup(input: { firstName: string; lastName: string; email: string; password: string }) {
    if (process.env.SIGNUP_ENABLED === "false") {
      throw new DomainError("Self-signup is disabled", 403, "signup_disabled");
    }
    const email = input.email.trim().toLowerCase();
    if (!/.+@.+\..+/.test(email)) throw new DomainError("Enter a valid email address", 400, "invalid_email");
    if ((input.password ?? "").length < 8) throw new DomainError("Password must be at least 8 characters", 400, "weak_password");
    if (!input.firstName?.trim()) throw new DomainError("First name is required", 400, "invalid_name");

    const existing = await this.prisma.db.user.findFirst({ where: { email } });
    if (existing) throw new DomainError("An account with this email already exists — sign in instead", 409, "email_taken");

    const tenant = await this.prisma.db.tenant.findFirst({ orderBy: { createdAt: "asc" } });
    const org = tenant
      ? await this.prisma.db.organization.findFirst({ where: { tenantId: tenant.id }, orderBy: { createdAt: "asc" } })
      : null;
    if (!tenant || !org) throw new DomainError("Platform has no tenant to sign up into", 500, "no_tenant");

    const user = await this.prisma.db.user.create({
      data: {
        tenantId: tenant.id,
        organizationId: org.id,
        email,
        firstName: input.firstName.trim(),
        lastName: input.lastName?.trim() ?? "",
        passwordHash: await bcrypt.hash(input.password, 10),
        status: "active",
      },
    });
    let learnerRole = await this.prisma.db.role.findFirst({ where: { tenantId: tenant.id, key: "learner" } });
    if (!learnerRole) {
      learnerRole = await this.prisma.db.role.create({
        data: { tenantId: tenant.id, organizationId: org.id, key: "learner", name: "Learner", permissions: [] },
      });
    }
    await this.prisma.db.roleAssignment.create({ data: { userId: user.id, roleId: learnerRole.id } }).catch(() => undefined);
    void this.prisma.db.activityEvent
      .create({ data: { tenantId: tenant.id, userId: user.id, kind: "login", refId: "signup" } })
      .catch(() => undefined);

    const claims: JwtClaims = {
      sub: user.id,
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      roles: ["learner"],
      name: `${user.firstName} ${user.lastName}`.trim(),
    };
    const token = jwt.sign(claims, secret(), { expiresIn: "12h" });
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
