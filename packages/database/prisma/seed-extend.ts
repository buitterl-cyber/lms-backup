/**
 * Idempotent extension of the demo seed: adds the remaining compliance frameworks with controls
 * assigned to the demo learner (green/amber/red mix), a real quiz on the ISO 27001 course, and a
 * notification — so the Compliance, Assessment and Notification surfaces show live content.
 * Run: tsx prisma/seed-extend.ts  (from packages/database)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const tenant = await db.tenant.findFirst({ orderBy: { createdAt: "asc" } });
  if (!tenant) throw new Error("no tenant");
  const tenantId = tenant.id;
  const user = await db.user.findFirst({ where: { tenantId }, orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("no user");
  const anyCourse = await db.course.findFirst({ where: { tenantId, providerKey: "ms-learn" } });
  const isoCourse = await db.course.findFirst({ where: { tenantId, title: { contains: "ISO 27001" } } });
  const past = new Date("2026-04-01");

  // ---- More compliance frameworks + controls assigned to the demo user ----
  const FRAMEWORKS: { key: string; name: string; controls: { code: string; title: string; reqCourse?: string | null; due?: Date | null }[] }[] = [
    { key: "nis2", name: "NIS2", controls: [{ code: "Art.21", title: "Cyber risk-management measures", reqCourse: anyCourse?.id, due: past }] },
    { key: "soc2", name: "SOC2", controls: [{ code: "CC6.1", title: "Logical & physical access controls" }, { code: "CC1.4", title: "Security awareness commitment" }] },
    { key: "hipaa", name: "HIPAA", controls: [{ code: "164.308(a)(5)", title: "Security awareness & training", reqCourse: anyCourse?.id }] },
    { key: "pci_dss", name: "PCI DSS", controls: [{ code: "Req.12.6", title: "Security awareness program", reqCourse: isoCourse?.id }] },
    { key: "cyber_essentials", name: "Cyber Essentials", controls: [{ code: "CE.4", title: "Malware protection" }] },
    { key: "iso9001", name: "ISO 9001", controls: [{ code: "7.2", title: "Competence" }] },
  ];

  for (const f of FRAMEWORKS) {
    let fw = await db.complianceFramework.findFirst({ where: { tenantId, key: f.key } });
    if (!fw) fw = await db.complianceFramework.create({ data: { tenantId, key: f.key, name: f.name } });
    for (const c of f.controls) {
      let ctrl = await db.complianceControl.findFirst({ where: { frameworkId: fw.id, code: c.code } });
      if (!ctrl) {
        ctrl = await db.complianceControl.create({
          data: { frameworkId: fw.id, code: c.code, title: c.title, requiredCourseIds: c.reqCourse ? [c.reqCourse] : [], requiredCertificationIds: [] },
        });
      }
      const existing = await db.complianceAssignment.findFirst({ where: { userId: user.id, controlId: ctrl.id } });
      if (!existing) {
        await db.complianceAssignment.create({
          data: { tenantId, userId: user.id, controlId: ctrl.id, status: "at_risk", dueAt: c.due ?? null },
        });
      }
    }
  }

  // ---- A real quiz on the ISO 27001 course ----
  if (isoCourse) {
    const existing = await db.assessment.findFirst({ where: { tenantId, courseId: isoCourse.id } });
    if (!existing) {
      const a = await db.assessment.create({ data: { tenantId, courseId: isoCourse.id, title: "ISO 27001 Foundations — Knowledge Check", passScore: 70 } });
      await db.question.createMany({
        data: [
          { assessmentId: a.id, type: "single", prompt: "Which standard governs Information Security Management Systems (ISMS)?", options: ["ISO 9001", "ISO 27001", "ISO 14001", "GDPR"], answerKey: ["ISO 27001"], points: 1 },
          { assessmentId: a.id, type: "true_false", prompt: "ISO 27001 requires a documented risk assessment.", options: ["true", "false"], answerKey: ["true"], points: 1 },
          { assessmentId: a.id, type: "single", prompt: "In the CIA triad, what does 'A' stand for?", options: ["Authentication", "Availability", "Authorization", "Auditing"], answerKey: ["Availability"], points: 1 },
          { assessmentId: a.id, type: "multiple", prompt: "Which are ISO 27001 Annex A control themes? (select all)", options: ["Access control", "Cryptography", "Marketing", "Physical security"], answerKey: ["Access control", "Cryptography", "Physical security"], points: 2 },
        ],
      });
    }
  }

  // ---- A notification ----
  const hasNotif = await db.notification.findFirst({ where: { tenantId, userId: user.id } });
  if (!hasNotif) {
    await db.notification.create({
      data: { tenantId, userId: user.id, channel: "in_app", kind: "certification_renewal", payload: { certification: "ISO 27001 Lead Auditor", message: "Expires in 22 days — renew to stay compliant." } },
    });
  }

  const fwCount = await db.complianceFramework.count({ where: { tenantId } });
  console.log(`Extended: ${fwCount} frameworks; quiz on ${isoCourse?.title ?? "(none)"}; notifications seeded.`);
}

main().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
