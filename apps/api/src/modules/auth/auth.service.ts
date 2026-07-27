import { Injectable } from "@nestjs/common";
import { DomainError } from "@riyada/shared";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../../common/prisma/prisma.service";
import { MailerService } from "../../common/mailer/mailer.service";

// Fails loudly rather than silently signing/verifying with a publicly-known default — a missing
// JWT_SECRET in production is a total auth-bypass waiting to happen, not something to paper over.
const secret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is not set — refusing to run with an insecure default in production");
  }
  return "dev-insecure-secret";
};

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  /** Roles allowed through the Admin/Manager portal. Everyone may use the learner portal —
   *  an admin is also a learner — but a pure learner is refused at the admin door. */
  static readonly ADMIN_ROLES = [
    "super_admin", "platform_admin", "org_admin", "dept_manager", "compliance_manager",
    "hr_manager", "finance_manager", "instructor", "trainer",
  ];

  async login(email: string, password: string, portal?: "learner" | "admin") {
    const user = await this.prisma.db.user.findFirst({
      where: { email },
      include: { roleAssignments: { include: { role: true } } },
    });
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new DomainError("Invalid email or password", 401, "invalid_credentials");
    }
    const roles = user.roleAssignments.map((ra) => ra.role.key);
    if (portal === "admin" && !roles.some((r) => AuthService.ADMIN_ROLES.includes(r))) {
      throw new DomainError(
        "This account doesn't have admin access — use the learner sign-in instead",
        403,
        "not_admin",
      );
    }
    await this.acceptPendingInvitations(user.id, user.tenantId);
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

  /** A manager's invite (IdentityService#inviteUser) pre-creates the user record and — if a course
   *  was assigned — an Invitation row. This applies any unaccepted ones the moment the invitee has
   *  a working account: enroll in the course, mark accepted. Safe to call on every login/signup;
   *  it's a no-op once there's nothing pending. */
  private async acceptPendingInvitations(userId: string, tenantId: string) {
    const pending = await this.prisma.db.invitation.findMany({
      where: { userId, acceptedAt: null, courseId: { not: null } },
    });
    for (const inv of pending) {
      await this.prisma.db.enrollment.upsert({
        where: { userId_courseId: { userId, courseId: inv.courseId! } },
        update: {},
        create: { tenantId, userId, courseId: inv.courseId!, assignedBy: inv.invitedBy, assignedReason: "Invited by manager", status: "enrolled" },
      });
      await this.prisma.db.invitation.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } });
    }
  }

  /** Email/password signup: new learner in the default tenant/org, logged in immediately.
   *  If this email belongs to a manager-invited account (status "invited", no password yet),
   *  this completes it in place instead of rejecting as a duplicate.
   *  Disable self-signup by setting SIGNUP_ENABLED=false. */
  async signup(input: { firstName: string; lastName: string; email: string; password: string }) {
    if (process.env.SIGNUP_ENABLED === "false") {
      throw new DomainError("Self-signup is disabled", 403, "signup_disabled");
    }
    const email = input.email.trim().toLowerCase();
    if (!/.+@.+\..+/.test(email)) throw new DomainError("Enter a valid email address", 400, "invalid_email");
    if ((input.password ?? "").length < 8) throw new DomainError("Password must be at least 8 characters", 400, "weak_password");
    if (!input.firstName?.trim()) throw new DomainError("First name is required", 400, "invalid_name");

    const existing = await this.prisma.db.user.findFirst({ where: { email } });
    if (existing?.passwordHash) {
      throw new DomainError("An account with this email already exists — sign in instead", 409, "email_taken");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    let user: { id: string; tenantId: string; organizationId: string; email: string; firstName: string; lastName: string };
    let tenantId: string;
    let organizationId: string;

    if (existing) {
      // Completing a manager-issued invite: keep the org/tenant the manager placed them in.
      user = await this.prisma.db.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          status: "active",
          firstName: input.firstName.trim(),
          lastName: input.lastName?.trim() || existing.lastName,
        },
      });
      tenantId = user.tenantId;
      organizationId = user.organizationId;
    } else {
      const tenant = await this.prisma.db.tenant.findFirst({ orderBy: { createdAt: "asc" } });
      const org = tenant
        ? await this.prisma.db.organization.findFirst({ where: { tenantId: tenant.id }, orderBy: { createdAt: "asc" } })
        : null;
      if (!tenant || !org) throw new DomainError("Platform has no tenant to sign up into", 500, "no_tenant");
      user = await this.prisma.db.user.create({
        data: {
          tenantId: tenant.id,
          organizationId: org.id,
          email,
          firstName: input.firstName.trim(),
          lastName: input.lastName?.trim() ?? "",
          passwordHash,
          status: "active",
        },
      });
      tenantId = tenant.id;
      organizationId = org.id;
    }

    let learnerRole = await this.prisma.db.role.findFirst({ where: { tenantId, key: "learner" } });
    if (!learnerRole) {
      learnerRole = await this.prisma.db.role.create({
        data: { tenantId, organizationId, key: "learner", name: "Learner", permissions: [] },
      });
    }
    await this.prisma.db.roleAssignment.create({ data: { userId: user.id, roleId: learnerRole.id } }).catch(() => undefined);
    await this.acceptPendingInvitations(user.id, tenantId);
    void this.prisma.db.activityEvent
      .create({ data: { tenantId, userId: user.id, kind: "login", refId: "signup" } })
      .catch(() => undefined);

    const roleAssignments = await this.prisma.db.roleAssignment.findMany({ where: { userId: user.id }, include: { role: true } });
    const roles = roleAssignments.map((ra) => ra.role.key);
    const claims: JwtClaims = {
      sub: user.id,
      tenantId,
      organizationId,
      roles: roles.length ? roles : ["learner"],
      name: `${user.firstName} ${user.lastName}`.trim(),
    };
    const token = jwt.sign(claims, secret(), { expiresIn: "12h" });
    return { token, user: { id: user.id, email: user.email, name: claims.name, roles: claims.roles } };
  }

  /** Forgot password: email a 15-minute signed reset link. Always answers "sent" so the
   *  endpoint can't be used to probe which emails exist. */
  async forgotPassword(email: string) {
    const user = await this.prisma.db.user.findFirst({ where: { email: email.trim().toLowerCase() } });
    if (user) {
      const token = jwt.sign({ sub: user.id, purpose: "reset" }, secret(), { expiresIn: "15m" });
      const url = `${process.env.WEB_URL || "https://lms.excisone.com"}/reset-password?token=${encodeURIComponent(token)}`;
      await this.mailer.send(
        user.email,
        "Reset your password",
        `<p>Hi ${user.firstName},</p>
         <p>Someone asked to reset the password for this account. The link below works for 15 minutes:</p>
         <p><a href="${url}">Choose a new password →</a></p>
         <p style="color:#888;font-size:12px">If this wasn't you, ignore this email — nothing changes.</p>`,
      );
    }
    return { sent: true };
  }

  async resetPassword(token: string, password: string) {
    let claims: { sub: string; purpose?: string };
    try {
      claims = jwt.verify(token, secret()) as { sub: string; purpose?: string };
    } catch {
      throw new DomainError("This reset link is invalid or has expired — request a new one", 400, "bad_reset_token");
    }
    if (claims.purpose !== "reset") throw new DomainError("This reset link is invalid", 400, "bad_reset_token");
    if ((password ?? "").length < 8) throw new DomainError("Password must be at least 8 characters", 400, "weak_password");
    await this.prisma.db.user.update({
      where: { id: claims.sub },
      data: { passwordHash: await bcrypt.hash(password, 10) },
    });
    return { reset: true };
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
