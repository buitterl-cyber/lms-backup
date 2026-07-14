/**
 * Idempotent seed for the Carl-vision LMS surfaces (2026-07-13): badge catalog, an instructor
 * account, enrollment deadlines (nudge demo), forum threads, course ratings, promotions +
 * best-sellers, a native modular course, and activity/XP history so every dashboard is alive.
 * Run: DATABASE_URL=... npx tsx prisma/seed-lms.ts  (from packages/database)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const DAY = 86_400_000;

async function main() {
  const tenant = await db.tenant.findFirst({ orderBy: { createdAt: "asc" } });
  if (!tenant) throw new Error("no tenant");
  const tenantId = tenant.id;
  const org = await db.organization.findFirst({ where: { tenantId } });
  if (!org) throw new Error("no org");

  const amir = await db.user.findFirst({ where: { tenantId, email: "amir@excis.com" } });
  const compliance = await db.user.findFirst({ where: { tenantId, email: "compliance@excis.com" } });
  const newhire = await db.user.findFirst({ where: { tenantId, email: "newhire@excis.com" } });
  if (!amir) throw new Error("no amir");

  // ---- Instructor account (same demo password as Amir) ----
  let instructorRole = await db.role.findFirst({ where: { tenantId, key: "instructor" } });
  if (!instructorRole) {
    instructorRole = await db.role.create({
      data: { tenantId, organizationId: org.id, key: "instructor", name: "Instructor", permissions: [] },
    });
  }
  let sarah = await db.user.findFirst({ where: { tenantId, email: "instructor@excis.com" } });
  if (!sarah) {
    sarah = await db.user.create({
      data: {
        tenantId, organizationId: org.id, email: "instructor@excis.com",
        firstName: "Sarah", lastName: "Chen", jobTitle: "Lead Instructor",
        departmentId: amir.departmentId, passwordHash: amir.passwordHash,
      },
    });
  }
  await db.roleAssignment.upsert({
    where: { userId_roleId_scopeType_scopeId: { userId: sarah.id, roleId: instructorRole.id, scopeType: "organization", scopeId: "" } },
    update: {},
    create: { userId: sarah.id, roleId: instructorRole.id },
  });

  // ---- Badge catalog ----
  const BADGES = [
    { key: "first-steps", name: "First Steps", description: "Complete your first course", icon: "⚡", xpReward: 50 },
    { key: "scholar", name: "Scholar", description: "Complete 5 courses", icon: "🎓", xpReward: 150 },
    { key: "on-fire", name: "On Fire", description: "Keep a 7-day streak", icon: "🔥", xpReward: 100 },
    { key: "community-voice", name: "Community Voice", description: "Start 3 forum discussions", icon: "💬", xpReward: 75 },
    { key: "helpful", name: "Helpful", description: "Earn 10 upvotes on your posts", icon: "🤝", xpReward: 100 },
    { key: "sharpshooter", name: "Sharpshooter", description: "Score 90%+ on an assessment", icon: "🎯", xpReward: 100 },
  ];
  for (const b of BADGES) {
    await db.badge.upsert({ where: { key: b.key }, update: {}, create: b });
  }

  // ---- Deadlines for the nudge demo: Amir's least-progressed enrollment due in 4 days ----
  const amirEnrollments = await db.enrollment.findMany({ where: { tenantId, userId: amir.id }, orderBy: { percent: "asc" } });
  if (amirEnrollments[0] && !amirEnrollments[0].dueAt) {
    await db.enrollment.update({ where: { id: amirEnrollments[0].id }, data: { dueAt: new Date(Date.now() + 4 * DAY) } });
  }
  // A not-started enrollment for the "hasn't started — deadline in N days" alert (newhire).
  const someCourse = await db.course.findFirst({ where: { tenantId, providerKey: "ms-learn" }, skip: 3 });
  if (newhire && someCourse) {
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: newhire.id, courseId: someCourse.id } },
      update: { dueAt: new Date(Date.now() + 5 * DAY) },
      create: { tenantId, userId: newhire.id, courseId: someCourse.id, status: "enrolled", percent: 0, dueAt: new Date(Date.now() + 5 * DAY), assignedBy: amir.id },
    });
  }

  // ---- Native modular course (sequential unlock demo) ----
  let native = await db.course.findFirst({ where: { tenantId, providerKey: "native" } });
  if (!native) {
    native = await db.course.create({
      data: {
        tenantId, providerKey: "native", externalId: "native-sec-essentials",
        title: "Security Essentials Onboarding", publisher: "In-house", isInternal: true,
        description:
          "Our in-house security onboarding: how we handle data, devices, phishing and incidents. " +
          "Four short modules — each unlocks the next, and completing the course levels up your security skills.",
        level: "Beginner", durationMinutes: 90, bestSeller: true, priceCents: 4900,
      },
    });
    const MODULES = [
      { position: 1, title: "Why security matters here", summary: "Threats we actually face", durationMinutes: 15, content: "Real incidents from our industry, what they cost, and the habits that stop 90% of them. Your responsibilities under our security policy." },
      { position: 2, title: "Devices & data handling", summary: "Laptops, phones, and where data may live", durationMinutes: 25, content: "Disk encryption, screen locks, approved storage locations, data classification levels, and what never leaves the tenant." },
      { position: 3, title: "Phishing & social engineering", summary: "Spotting and reporting attacks", durationMinutes: 25, content: "Anatomy of a phish, real examples that got past filters, thread-hijacking, and the one-click report flow." },
      { position: 4, title: "Incidents: what to do", summary: "Your first 30 minutes", durationMinutes: 25, content: "Who to call, what to preserve, what not to touch, and the no-blame reporting culture. Finish to earn your certificate." },
    ];
    for (const m of MODULES) {
      await db.courseModule.create({ data: { tenantId, courseId: native.id, ...m } });
    }
  }

  // ---- Best-sellers + pricing on popular provider courses ----
  const BEST = ["security", "azure fundamentals", "cloud concepts", "identity"];
  for (const term of BEST) {
    const c = await db.course.findFirst({ where: { tenantId, title: { contains: term, mode: "insensitive" }, bestSeller: false } });
    if (c) await db.course.update({ where: { id: c.id }, data: { bestSeller: true, priceCents: 9900 } });
  }

  // ---- Promotions ----
  if ((await db.promotion.count({ where: { tenantId } })) === 0) {
    await db.promotion.createMany({
      data: [
        { tenantId, title: "Launch offer: team bundles", subtitle: "5+ seats on any best-seller — priority onboarding included", discountPct: 20, endsAt: new Date(Date.now() + 45 * DAY) },
        { tenantId, title: "Security month", subtitle: "All security-track courses for individual learners", discountPct: 15, endsAt: new Date(Date.now() + 20 * DAY) },
      ],
    });
  }

  // ---- Forum: pinned instructor FAQ + an answered question + an anonymous one ----
  const forumCourse = amirEnrollments[0]
    ? await db.course.findFirst({ where: { id: amirEnrollments[0].courseId } })
    : someCourse;
  if (forumCourse && (await db.forumThread.count({ where: { tenantId, courseId: forumCourse.id } })) === 0) {
    await db.forumThread.create({
      data: {
        tenantId, courseId: forumCourse.id, authorId: sarah.id, pinned: true, upvotes: 12,
        title: `FAQ — common questions about ${forumCourse.title.slice(0, 40)}`,
        body: "I've compiled the most common questions from previous cohorts. Please read this before posting a new question — it likely covers yours already.",
        createdAt: new Date(Date.now() - 6 * DAY),
      },
    });
    const q = await db.forumThread.create({
      data: {
        tenantId, courseId: forumCourse.id, authorId: amir.id, upvotes: 5,
        title: "Does the final assessment cover the optional sections?",
        body: "I'm short on time this week — can I skip the optional deep-dives and still pass the knowledge check?",
        createdAt: new Date(Date.now() - 2 * DAY),
      },
    });
    const ans = await db.forumReply.create({
      data: {
        tenantId, threadId: q.id, authorId: sarah.id, upvotes: 7,
        body: "The assessment only covers the core modules — optional sections are enrichment. That said, the deep-dives are where the real-world value is; come back to them after.",
        createdAt: new Date(Date.now() - 1 * DAY),
      },
    });
    await db.forumThread.update({ where: { id: q.id }, data: { answeredReplyId: ans.id } });
    if (compliance) {
      await db.forumThread.create({
        data: {
          tenantId, courseId: forumCourse.id, authorId: compliance.id, anonymous: true, upvotes: 3,
          title: "Struggling with the module 3 quiz — is it just me?",
          body: "I've been through the lesson twice and the quiz still catches me out. Is the wording tricky or am I missing something?",
          createdAt: new Date(Date.now() - 0.2 * DAY),
        },
      });
    }
  }

  // ---- Course ratings ----
  const ratedCourses = await db.course.findMany({ where: { tenantId }, take: 4 });
  const raters = [amir, compliance, newhire].filter(Boolean) as { id: string }[];
  const ratings = [5, 4, 3];
  for (let ci = 0; ci < ratedCourses.length; ci++) {
    for (let ri = 0; ri < raters.length; ri++) {
      await db.courseReview.upsert({
        where: { courseId_userId: { courseId: ratedCourses[ci].id, userId: raters[ri].id } },
        update: {},
        create: {
          tenantId, courseId: ratedCourses[ci].id, userId: raters[ri].id,
          rating: ratings[(ci + ri) % ratings.length],
          comment: ci === 0 && ri === 0 ? "The hands-on sections finally made this click for me — very clear explanations." : ci === 1 && ri === 1 ? "Some quiz questions feel ambiguous — hard to know what's being tested." : null,
        },
      });
    }
  }

  // ---- Peer review queue item ----
  if ((await db.peerReview.count({ where: { tenantId, status: "pending" } })) === 0 && forumCourse) {
    await db.peerReview.create({
      data: {
        tenantId, courseId: forumCourse.id, submitterId: amir.id, title: "Module 2 practical exercise",
        content: "Submitted my hardening checklist for the sandbox VM — closed all flagged ports, enabled disk encryption, and documented the change control steps.",
      },
    });
  }

  // ---- Activity + XP history (streaks, heatmap, leaderboard) ----
  if ((await db.activityEvent.count({ where: { tenantId } })) < 10) {
    const users = [amir, compliance, newhire].filter(Boolean) as { id: string }[];
    for (let u = 0; u < users.length; u++) {
      for (let d = 0; d < 21; d++) {
        // Amir active most days (live streak incl. today); others patchier.
        if (u === 0 ? d % 4 !== 3 || d < 3 : d % (u + 2) === 0) {
          await db.activityEvent.create({
            data: { tenantId, userId: users[u].id, kind: d % 5 === 0 ? "module_completed" : "login", createdAt: new Date(Date.now() - d * DAY + 3600_000) },
          });
        }
      }
    }
    await db.xpEvent.createMany({
      data: [
        { tenantId, userId: amir.id, amount: 250, reason: "course_completed", createdAt: new Date(Date.now() - 8 * DAY) },
        { tenantId, userId: amir.id, amount: 40, reason: "module_completed", createdAt: new Date(Date.now() - 3 * DAY) },
        { tenantId, userId: amir.id, amount: 15, reason: "forum_post", createdAt: new Date(Date.now() - 2 * DAY) },
        { tenantId, userId: amir.id, amount: 40, reason: "module_completed", createdAt: new Date(Date.now() - 1 * DAY) },
        ...(compliance ? [{ tenantId, userId: compliance.id, amount: 250, reason: "course_completed", createdAt: new Date(Date.now() - 5 * DAY) }] : []),
        ...(newhire ? [{ tenantId, userId: newhire.id, amount: 40, reason: "module_completed", createdAt: new Date(Date.now() - 4 * DAY) }] : []),
      ],
    });
  }

  console.log("seed-lms complete:", {
    instructor: sarah.email,
    badges: BADGES.length,
    nativeCourse: native.title,
  });
}

main().finally(() => db.$disconnect());
