"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.msLearnFactory = exports.MsLearnProvider = void 0;
const DESCRIPTOR = {
    key: "ms-learn",
    displayName: "Microsoft Learn",
    phase: 1,
    capabilities: {
        catalogSync: true, enrollment: false, progressTracking: true, completionTracking: true,
        certificates: true, ssoLaunch: true, webhooks: false, skillMetadata: true, scorm: false, xapi: true,
    },
};
class MsLearnProvider {
    config;
    descriptor = DESCRIPTOR;
    constructor(config) {
        this.config = config;
    }
    async healthCheck() { return { ok: true, detail: "stub" }; }
    async listCourses(opts = {}) {
        // TODO: GET https://learn.microsoft.com/api/catalog/?type=modules&locale=
        void opts;
        return { items: [], total: 0 };
    }
    async getCourse(externalId) { void externalId; return null; }
    async listLearningPaths(opts = {}) {
        // TODO: GET catalog?type=learningPaths
        void opts;
        return { items: [] };
    }
    async syncCatalog(opts = {}) {
        void opts;
        const startedAt = new Date();
        return { providerKey: this.descriptor.key, startedAt, finishedAt: startedAt, coursesUpserted: 0, pathsUpserted: 0, coursesRetired: 0, errors: [] };
    }
    async getCourseSkills(externalId) {
        // MS Learn modules carry roles/products/subjects — map to SkillTags for the reconciler.
        void externalId;
        return [];
    }
    async createLearner(input) {
        // MS Learn has no portal user; we key progress by the platform user via xAPI.
        return { externalLearnerId: input.internalUserId };
    }
    async enrollLearner(input) {
        // Free content: "enroll" records intent + deep-links the learner.
        return { externalEnrollmentId: `mslearn:${input.externalCourseId}`, externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "enrolled", enrolledAt: new Date() };
    }
    async getProgress(input) {
        return { externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "in-progress", percent: 0 };
    }
    async getCertificate(input) { void input; return null; }
    async getLaunchUrl(input) {
        return `https://learn.microsoft.com/training/modules/${input.externalCourseId}/`;
    }
}
exports.MsLearnProvider = MsLearnProvider;
exports.msLearnFactory = {
    key: DESCRIPTOR.key,
    create: (config) => new MsLearnProvider(config),
};
