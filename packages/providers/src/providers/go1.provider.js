"use strict";
/**
 * GO1 connector (Phase 1) — reference implementation of the Provider Abstraction Layer.
 *
 * This is a production-shaped skeleton: the contract, normalization, pagination, idempotency,
 * and capability declaration are real; the HTTP calls are marked TODO so the MVP build plan
 * (docs/05) can wire the GO1 OAuth2 client + endpoints. Use this file as the template for
 * every other connector — copy, rename, fill the TODOs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.go1Factory = exports.Go1Provider = void 0;
const DESCRIPTOR = {
    key: "go1",
    displayName: "GO1",
    phase: 1,
    capabilities: {
        catalogSync: true,
        enrollment: true,
        progressTracking: true,
        completionTracking: true,
        certificates: true,
        ssoLaunch: true,
        webhooks: true,
        skillMetadata: true,
        scorm: true,
        xapi: true,
    },
};
class Go1Provider {
    config;
    descriptor = DESCRIPTOR;
    constructor(config) {
        this.config = config;
    }
    async healthCheck() {
        // TODO: GET /oauth/token then a cheap authenticated call (e.g. /learning-objects?limit=1)
        return { ok: true, detail: "stub" };
    }
    async listCourses(opts = {}) {
        // TODO: GET https://api.go1.com/v3/learning-objects?type=course&updated_after=...
        // Map each GO1 learning-object -> normalizeCourse().
        void opts;
        return { items: [], total: 0 };
    }
    async getCourse(externalId) {
        // TODO: GET /v3/learning-objects/{id}
        void externalId;
        return null;
    }
    async listLearningPaths(opts = {}) {
        // TODO: GET /v3/learning-objects?type=learning_pathway
        void opts;
        return { items: [] };
    }
    async syncCatalog(opts = {}) {
        const startedAt = new Date();
        // TODO: page through listCourses({ updatedSince }) + listLearningPaths, upsert into the
        // normalized catalog store, mark missing-as-retired. Honor incremental `updatedSince`.
        void opts;
        return {
            providerKey: this.descriptor.key,
            startedAt,
            finishedAt: startedAt,
            coursesUpserted: 0,
            pathsUpserted: 0,
            coursesRetired: 0,
            errors: [],
        };
    }
    async getCourseSkills(externalId) {
        // GO1 exposes tags/topics — map raw -> SkillTag and let the Skills reconciler resolve.
        void externalId;
        return [];
    }
    async createLearner(input) {
        // TODO: POST /v3/users (GO1 portal user). Idempotent on email.
        void input;
        return { externalLearnerId: "stub" };
    }
    async enrollLearner(input) {
        // TODO: POST /enrollment with Idempotency-Key header.
        return {
            externalEnrollmentId: "stub",
            externalLearnerId: input.externalLearnerId,
            externalCourseId: input.externalCourseId,
            status: "enrolled",
            enrolledAt: new Date(),
        };
    }
    async getProgress(input) {
        // TODO: GET /enrollment?userId=&loId=
        return {
            externalLearnerId: input.externalLearnerId,
            externalCourseId: input.externalCourseId,
            status: "in-progress",
            percent: 0,
        };
    }
    async getCertificate(input) {
        // TODO: GET certificate for completed enrollment; map issuedAt/expiresAt/cpdHours.
        void input;
        return null;
    }
    async getLaunchUrl(input) {
        // TODO: GO1 SSO deep-link.
        return input.returnUrl;
    }
}
exports.Go1Provider = Go1Provider;
exports.go1Factory = {
    key: DESCRIPTOR.key,
    create: (config) => new Go1Provider(config),
};
