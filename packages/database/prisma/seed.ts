/**
 * Demo seed: one tenant, one organization, a department, RBAC roles, a slice of the Skills
 * Graph, two job roles (Helpdesk Engineer, Cloud Security Engineer), a few courses with skill
 * mappings, a learner with a partial skill profile, an ISO 27001 + GDPR compliance slice, and a
 * certificate nearing expiry. Running the intelligence engines over this seed reproduces the
 * brief's worked example. Run: pnpm --filter @riyada/database prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const tenant = await db.tenant.create({
    data: { name: "Riyada Demo", slug: "demo", defaultLocale: "en", defaultCurrency: "USD", region: "me" },
  });
  const org = await db.organization.create({
    data: { tenantId: tenant.id, name: "Excis Group", slug: "excis", industry: "IT Services" },
  });
  const dept = await db.department.create({
    data: { tenantId: tenant.id, organizationId: org.id, name: "Cloud & Security" },
  });

  // RBAC roles
  for (const [key, name] of [
    ["org_admin", "Organization Admin"],
    ["compliance_manager", "Compliance Manager"],
    ["learner", "Learner"],
  ] as const) {
    await db.role.create({
      data: { tenantId: tenant.id, organizationId: org.id, key, name, permissions: [] },
    });
  }

  // Skills Graph slice (prerequisites expressed via SkillEdge)
  const skillDefs = [
    ["linux", "Linux"], ["networking", "Networking"], ["iam", "IAM"],
    ["aws-sec", "AWS Security"], ["azure-sec", "Azure Security"], ["terraform", "Terraform"],
    ["iso27001", "ISO 27001"], ["soc2", "SOC2"], ["python", "Python"], ["nis2", "NIS2"],
  ] as const;
  const skills: Record<string, string> = {};
  for (const [slug, name] of skillDefs) {
    const s = await db.skill.create({ data: { tenantId: tenant.id, name, externalRef: slug } });
    skills[slug] = s.id;
  }
  const prereq = async (from: string, to: string) =>
    db.skillEdge.create({ data: { fromId: skills[from], toId: skills[to], kind: "prerequisite", weight: 1 } });
  await prereq("linux", "networking");
  await prereq("networking", "aws-sec");
  await prereq("aws-sec", "terraform");

  // Job roles + requirements
  const helpdesk = await db.jobRole.create({ data: { tenantId: tenant.id, name: "Helpdesk Engineer", family: "infra", level: 1 } });
  const cloudSec = await db.jobRole.create({ data: { tenantId: tenant.id, name: "Cloud Security Engineer", family: "infra", level: 4 } });
  const req = (jobRoleId: string, slug: string, targetLevel: number, importance = "required") =>
    db.roleSkillRequirement.create({ data: { jobRoleId, skillId: skills[slug], targetLevel, importance } });
  await Promise.all([
    req(cloudSec.id, "aws-sec", 4), req(cloudSec.id, "azure-sec", 3), req(cloudSec.id, "iso27001", 3),
    req(cloudSec.id, "iam", 4), req(cloudSec.id, "terraform", 3), req(cloudSec.id, "soc2", 3),
    req(cloudSec.id, "python", 3, "preferred"), req(cloudSec.id, "nis2", 3, "preferred"),
  ]);
  await db.careerPath.create({ data: { tenantId: tenant.id, fromRoleId: helpdesk.id, toRoleId: cloudSec.id, difficulty: 4, typicalMonths: 12 } });

  // Learner with partial profile (has AWS Security + IAM)
  const learner = await db.user.create({
    data: {
      tenantId: tenant.id, organizationId: org.id, departmentId: dept.id,
      email: "amir@excis.com", firstName: "Amir", lastName: "K", jobTitle: "Helpdesk Engineer",
      currentRoleId: helpdesk.id, targetRoleId: cloudSec.id,
    },
  });
  await db.userSkill.createMany({
    data: [
      { userId: learner.id, skillId: skills["aws-sec"], level: 4, source: "assessment" },
      { userId: learner.id, skillId: skills["iam"], level: 4, source: "certificate" },
    ],
  });

  // Catalog: courses mapped to skills. All seeded as GO1 — GO1 is the only provider we have a
  // confirmed relationship with today; don't reintroduce other provider keys here without a real
  // connection to back them (see /company page copy + the "Providers" admin page for context).
  const courseDefs = [
    ["go1", "Azure Security Engineer", "azure-sec", 4],
    ["go1", "Terraform on AWS", "terraform", 3],
    ["go1", "SOC2 Readiness", "soc2", 3],
    ["go1", "ISO 27001 Foundations", "iso27001", 2],
    ["go1", "Python for Security", "python", 3],
  ] as const;
  for (const [provider, title, slug, level] of courseDefs) {
    const c = await db.course.create({
      data: {
        tenantId: tenant.id, providerKey: provider, externalId: `${provider}-${slug}`,
        title, description: title, level: ["beginner", "intermediate", "advanced", "expert"][level - 1],
        durationMinutes: 240, modality: "self-paced",
      },
    });
    await db.courseSkill.create({ data: { courseId: c.id, skillId: skills[slug], confidence: 0.9 } });
  }

  // Compliance: ISO 27001 + GDPR with one control each, mapped to required training
  const iso = await db.complianceFramework.create({ data: { tenantId: tenant.id, key: "iso27001", name: "ISO 27001" } });
  const gdpr = await db.complianceFramework.create({ data: { tenantId: tenant.id, key: "gdpr", name: "GDPR" } });
  const isoCourse = await db.course.findFirst({ where: { tenantId: tenant.id, providerKey: "go1" } });
  const ctrlA63 = await db.complianceControl.create({
    data: { frameworkId: iso.id, code: "A.6.3", title: "Security awareness & training", requiredCourseIds: [isoCourse!.id], requiredCertificationIds: [] },
  });
  await db.complianceControl.create({
    data: { frameworkId: gdpr.id, code: "Art.39", title: "DPO training", requiredCourseIds: [], requiredCertificationIds: [] },
  });
  await db.complianceAssignment.create({
    data: { tenantId: tenant.id, userId: learner.id, controlId: ctrlA63.id, status: "at_risk", dueAt: new Date("2026-05-01") },
  });

  // Certification nearing expiry (drives the expiry sweep + renewal campaign)
  const cert = await db.certification.create({ data: { tenantId: tenant.id, name: "ISO 27001 Lead Auditor", body: "PECB", validMonths: 36, cpdRequired: 20 } });
  await db.earnedCertificate.create({
    data: { tenantId: tenant.id, userId: learner.id, certificationId: cert.id, issuedAt: new Date("2023-07-01"), expiresAt: new Date("2026-06-29"), cpdHours: 12, status: "expiring" },
  });

  console.log(`Seeded tenant=${tenant.slug} org=${org.slug} learner=${learner.email}`);
}

main().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
