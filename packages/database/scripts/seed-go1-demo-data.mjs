/**
 * One-off, idempotent enrichment script for GO1-readiness UI verification — NOT part of the
 * regular seed pipeline (prisma/seed.ts). Takes the demo tenant's existing "go1" course (ISO
 * 27001 Foundations, seeded in prisma/seed.ts) and:
 *   - gives it a real thumbnail + publisher, like a synced GO1 catalog entry would have
 *   - adds two more GO1-shaped courses (titles/tags lifted from the go1-sample-response.json
 *     fixture used by MockGo1Provider) so the catalog shows more than one GO1 item
 *   - upserts an active ProviderConnection for "go1" with a lastSyncedAt, so the Providers
 *     admin page has something real to show a status badge for
 *   - adds an EarnedCertificate with an externalId set (i.e. "issued by a connected provider")
 *     so the internal/external "source" column has a real external row to display
 * Safe to re-run (upserts throughout). Uses stable picsum.photos URLs as stand-ins for real GO1
 * cover art — not a claim about GO1's actual CDN.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const tenant = await db.tenant.findFirstOrThrow({ where: { slug: "demo" } });
  const org = await db.organization.findFirstOrThrow({ where: { tenantId: tenant.id, slug: "excis" } });
  const learner = await db.user.findFirstOrThrow({ where: { tenantId: tenant.id, email: "amir@excis.com" } });

  // 1. Enrich the existing go1 course with a thumbnail + publisher.
  const isoCourse = await db.course.findFirst({ where: { tenantId: tenant.id, providerKey: "go1" } });
  if (isoCourse) {
    await db.course.update({
      where: { id: isoCourse.id },
      data: {
        description: isoCourse.description === isoCourse.title
          ? "Covers the awareness and training controls required under ISO 27001 Annex A.6.3, mapped to your compliance framework."
          : isoCourse.description,
        imageUrl: "https://picsum.photos/seed/go1-iso27001/640/360",
        publisher: "GO1 Content Library",
      },
    });
  }

  // 2. Two more GO1-shaped courses (same titles/tags as the go1-sample-response.json fixture).
  const skillDefs = [
    ["security-awareness", "Security Awareness"],
    ["leadership", "Leadership"],
  ];
  const skillIds = {};
  for (const [slug, name] of skillDefs) {
    const existing = await db.skill.findFirst({ where: { tenantId: tenant.id, name } });
    skillIds[slug] = existing ? existing.id : (await db.skill.create({ data: { tenantId: tenant.id, name } })).id;
  }

  const extraCourses = [
    {
      externalId: "lo-9f21a3",
      title: "Cybersecurity Awareness Fundamentals",
      description: "Covers phishing recognition, password hygiene, and social engineering red flags for general staff.",
      level: "beginner",
      durationMinutes: 45,
      imageUrl: "https://picsum.photos/seed/go1-cyberaware/640/360",
      skill: "security-awareness",
    },
    {
      externalId: "lo-4b7710",
      title: "Leading Distributed Teams",
      description: "Practical management techniques for leading remote and hybrid teams across time zones.",
      level: "intermediate",
      durationMinutes: 90,
      imageUrl: "https://picsum.photos/seed/go1-distributed-teams/640/360",
      skill: "leadership",
    },
  ];

  const createdCourseIds = [];
  for (const c of extraCourses) {
    const course = await db.course.upsert({
      where: { providerKey_externalId_tenantId: { providerKey: "go1", externalId: c.externalId, tenantId: tenant.id } },
      update: { title: c.title, description: c.description, imageUrl: c.imageUrl, publisher: "GO1 Content Library" },
      create: {
        tenantId: tenant.id, providerKey: "go1", externalId: c.externalId, title: c.title,
        description: c.description, level: c.level, durationMinutes: c.durationMinutes,
        modality: "self-paced", imageUrl: c.imageUrl, publisher: "GO1 Content Library",
      },
    });
    await db.courseSkill.upsert({
      where: { courseId_skillId: { courseId: course.id, skillId: skillIds[c.skill] } },
      update: {},
      create: { courseId: course.id, skillId: skillIds[c.skill], confidence: 0.8 },
    });
    createdCourseIds.push(course.id);
  }

  // 3. Active GO1 ProviderConnection with a real lastSyncedAt, so the Providers page has a
  // populated status badge + sync-result row to show.
  const enc = Buffer.from(JSON.stringify({ clientId: "demo-client-id", clientSecret: "demo-secret" })).toString("base64");
  await db.providerConnection.upsert({
    where: { organizationId_providerKey: { organizationId: org.id, providerKey: "go1" } },
    update: { status: "active", lastSyncedAt: new Date() },
    create: {
      tenantId: tenant.id, organizationId: org.id, providerKey: "go1", displayName: "GO1",
      credentialsEnc: enc, status: "active", lastSyncedAt: new Date(),
    },
  });

  // 4. An EarnedCertificate with externalId set — simulates a certificate issued via a
  // connected provider (as opposed to the existing internally-tracked "ISO 27001 Lead Auditor").
  let goCert = await db.certification.findFirst({ where: { tenantId: tenant.id, name: "Cybersecurity Awareness Certificate" } });
  if (!goCert) {
    goCert = await db.certification.create({
      data: { tenantId: tenant.id, name: "Cybersecurity Awareness Certificate", body: "GO1", validMonths: 12, cpdRequired: 1 },
    });
  }
  const existingEarned = await db.earnedCertificate.findFirst({
    where: { tenantId: tenant.id, userId: learner.id, certificationId: goCert.id },
  });
  if (!existingEarned) {
    await db.earnedCertificate.create({
      data: {
        tenantId: tenant.id, userId: learner.id, certificationId: goCert.id,
        externalId: "mock-cert-go1-enr-1", issuedAt: new Date(), expiresAt: new Date(Date.now() + 365 * 86400_000),
        cpdHours: 1, status: "valid",
      },
    });
  }

  // 5. Enroll + complete the learner in one of the new GO1 courses (drives the Reports "provider"
  // column + dashboard "My courses" thumbnail with real completion data).
  if (createdCourseIds[0]) {
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: learner.id, courseId: createdCourseIds[0] } },
      update: { status: "completed", percent: 100, completedAt: new Date() },
      create: {
        tenantId: tenant.id, userId: learner.id, courseId: createdCourseIds[0],
        assignedBy: "self", status: "completed", percent: 100, completedAt: new Date(),
      },
    });
  }
  if (createdCourseIds[1]) {
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: learner.id, courseId: createdCourseIds[1] } },
      update: {},
      create: {
        tenantId: tenant.id, userId: learner.id, courseId: createdCourseIds[1],
        assignedBy: "self", status: "in-progress", percent: 40,
      },
    });
  }

  console.log("GO1 demo enrichment complete.");
}

main().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
