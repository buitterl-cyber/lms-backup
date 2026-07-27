import { Injectable } from "@nestjs/common";
import { getTenantContext } from "@riyada/shared";
import { ROLE_PERMISSIONS, type UserRoleKey } from "@riyada/shared";
import { PrismaService } from "../../common/prisma/prisma.service";
import { MailerService } from "../../common/mailer/mailer.service";

const WEB_URL = () => process.env.WEB_URL || "https://riyadaintel.com";

/** Org hierarchy + user lifecycle + RBAC assignment. Identity itself is federated to Keycloak;
 *  this owns the platform-side profile, org tree, and role grants. */
@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  async inviteUser(input: { email: string; firstName: string; lastName: string; departmentId?: string; role?: UserRoleKey; courseId?: string }) {
    const { tenantId, organizationId, userId: actor } = getTenantContext();
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

    let course: { id: string; title: string } | null = null;
    if (input.courseId) {
      course = await this.prisma.db.course.findFirst({
        where: { id: input.courseId, tenantId },
        select: { id: true, title: true },
      });
      if (course) {
        await this.prisma.db.invitation.create({
          data: { tenantId, organizationId, userId: user.id, courseId: course.id, invitedBy: actor ?? "system" },
        });
      }
    }
    await this.sendInviteEmail(user, course);
    return { id: user.id, email: user.email, status: user.status };
  }

  /** The manager-invite email — logo, headline, and a straight line to the learner login page.
   *  The assigned course (if any) auto-enrolls the moment this person has an account
   *  (see AuthService#acceptPendingInvitations, called from both signup and login). */
  private async sendInviteEmail(user: { email: string; firstName: string }, course: { title: string } | null) {
    const loginUrl = `${WEB_URL()}/login/learner`;
    const logoUrl = `${WEB_URL()}/brand/riyada-mark.png`;
    const courseLine = course
      ? `<p style="font-size:14px;color:#333">Your manager has already enrolled you in <strong>${course.title}</strong> — it'll be waiting for you as soon as you sign in.</p>`
      : "";
    await this.mailer.send(
      user.email,
      "You've been invited to Riyada Intelligence",
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px">
         <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
           <tr>
             <td><img src="${logoUrl}" alt="Riyada Intelligence" width="40" height="40" style="display:block" /></td>
             <td style="padding-left:10px;font-size:18px;font-weight:600;color:#111">Riyada Intelligence</td>
           </tr>
         </table>
         <p style="font-size:12px;color:#888;letter-spacing:0.02em;margin:0 0 18px">Riyada Intelligence: revolutionising professional education.</p>
         <p style="font-size:21px;line-height:1.5;font-weight:600">You have been invited to further your professional skills with Riyada Intelligence!</p>
         ${courseLine}
         <p style="margin:28px 0">
           <a href="${loginUrl}" style="background:#4f46e5;color:#ffffff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
             Go to the Learner Portal →
           </a>
         </p>
         <p style="color:#888;font-size:12px">Hi ${user.firstName}, this invite was sent by your manager on Riyada Intelligence.</p>
       </div>`,
    );
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
