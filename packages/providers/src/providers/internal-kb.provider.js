"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalKbFactories = exports.InternalKbProvider = void 0;
function descriptorFor(source) {
    return {
        key: `internal:${source}`,
        displayName: `Internal — ${source}`,
        phase: 4,
        capabilities: {
            catalogSync: true, enrollment: true, progressTracking: true, completionTracking: true,
            certificates: true, ssoLaunch: false, webhooks: true, skillMetadata: false, scorm: false, xapi: true,
        },
    };
}
class InternalKbProvider {
    source;
    config;
    descriptor;
    constructor(source, config) {
        this.source = source;
        this.config = config;
        this.descriptor = descriptorFor(source);
    }
    async healthCheck() { return { ok: true, detail: `internal:${this.source} stub` }; }
    async listCourses(opts = {}) {
        // TODO: list documents (pages/files/policies) from the backend; each becomes a draft course
        // that the AI Knowledge Academy expands into lessons + assessments + competency map.
        void opts;
        return { items: [], total: 0 };
    }
    async getCourse(externalId) { void externalId; return null; }
    async listLearningPaths(opts = {}) { void opts; return { items: [] }; }
    async syncCatalog(opts = {}) {
        void opts;
        const startedAt = new Date();
        return { providerKey: this.descriptor.key, startedAt, finishedAt: startedAt, coursesUpserted: 0, pathsUpserted: 0, coursesRetired: 0, errors: [] };
    }
    async getCourseSkills(externalId) { void externalId; return []; }
    async createLearner(input) { return { externalLearnerId: input.internalUserId }; }
    async enrollLearner(input) {
        return { externalEnrollmentId: `internal:${input.externalCourseId}`, externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "enrolled", enrolledAt: new Date() };
    }
    async getProgress(input) {
        return { externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "in-progress", percent: 0 };
    }
    async getCertificate(input) { void input; return null; }
}
exports.InternalKbProvider = InternalKbProvider;
exports.internalKbFactories = ["confluence", "sharepoint", "google-drive", "m365", "notion"].map((source) => ({ key: `internal:${source}`, create: (config) => new InternalKbProvider(source, config) }));
