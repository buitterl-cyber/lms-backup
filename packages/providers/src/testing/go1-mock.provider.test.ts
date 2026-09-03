import { describe, expect, it } from "vitest";
import { MockGo1Provider } from "./go1-mock.provider";

/**
 * Exercises the full CourseProvider contract against fixture data, without any real GO1 access.
 * The point: prove the platform side (enrollment.service.ts's flow, normalization, idempotency)
 * works correctly against *a* GO1-shaped provider now, so that swapping the mock's fixture reads
 * for real fetch() calls in go1.provider.ts is the only thing left once we have real docs/creds.
 */
describe("MockGo1Provider (fixture-backed GO1 double)", () => {
  it("lists courses normalized to the canonical shape", async () => {
    const provider = new MockGo1Provider();
    const page = await provider.listCourses();
    expect(page.items.length).toBeGreaterThan(0);
    for (const course of page.items) {
      expect(course.providerKey).toBe("go1");
      expect(course.externalId).toBeTruthy();
      expect(course.title).toBeTruthy();
      expect(course.skills.every((s) => typeof s.raw === "string")).toBe(true);
    }
  });

  it("excludes learning pathways from listCourses and includes them in listLearningPaths", async () => {
    const provider = new MockGo1Provider();
    const courses = await provider.listCourses();
    const paths = await provider.listLearningPaths();
    expect(paths.items.length).toBeGreaterThan(0);
    const pathIds = new Set(paths.items.map((p) => p.externalId));
    expect(courses.items.some((c) => pathIds.has(c.externalId))).toBe(false);
  });

  it("createLearner is idempotent on email", async () => {
    const provider = new MockGo1Provider();
    const first = await provider.createLearner({ internalUserId: "u1", email: "a@example.com", firstName: "A", lastName: "One" });
    const second = await provider.createLearner({ internalUserId: "u1", email: "a@example.com", firstName: "A", lastName: "One" });
    expect(second.externalLearnerId).toBe(first.externalLearnerId);
  });

  it("enrollLearner is idempotent on (learner, course)", async () => {
    const provider = new MockGo1Provider();
    const { externalLearnerId } = await provider.createLearner({ internalUserId: "u1", email: "a@example.com", firstName: "A", lastName: "One" });
    const page = await provider.listCourses();
    const courseId = page.items[0].externalId;

    const first = await provider.enrollLearner({ externalLearnerId, externalCourseId: courseId, idempotencyKey: "u1:c1" });
    const second = await provider.enrollLearner({ externalLearnerId, externalCourseId: courseId, idempotencyKey: "u1:c1" });
    expect(second.externalEnrollmentId).toBe(first.externalEnrollmentId);
  });

  it("tracks progress through to completion and issues a certificate", async () => {
    const provider = new MockGo1Provider();
    const { externalLearnerId } = await provider.createLearner({ internalUserId: "u1", email: "a@example.com", firstName: "A", lastName: "One" });
    const page = await provider.listCourses();
    const courseId = page.items[0].externalId;
    await provider.enrollLearner({ externalLearnerId, externalCourseId: courseId, idempotencyKey: "u1:c1" });

    const before = await provider.getProgress({ externalLearnerId, externalCourseId: courseId });
    expect(before.status).toBe("enrolled");
    expect(await provider.getCertificate({ externalLearnerId, externalCourseId: courseId })).toBeNull();

    provider.simulateProgress(externalLearnerId, courseId, 100);

    const after = await provider.getProgress({ externalLearnerId, externalCourseId: courseId });
    expect(after.status).toBe("completed");
    expect(after.percent).toBe(100);

    const cert = await provider.getCertificate({ externalLearnerId, externalCourseId: courseId });
    expect(cert).not.toBeNull();
    expect(cert?.externalCourseId).toBe(courseId);
  });

  it("produces an SSO launch URL", async () => {
    const provider = new MockGo1Provider();
    const url = await provider.getLaunchUrl({ externalLearnerId: "mock-learner-1", externalCourseId: "lo-9f21a3", returnUrl: "https://riyadaintel.com/learner" });
    expect(url).toContain("lo-9f21a3");
  });
});
