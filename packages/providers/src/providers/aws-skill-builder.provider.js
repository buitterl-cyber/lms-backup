"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.awsSkillBuilderFactory = exports.AwsSkillBuilderProvider = void 0;
const DESCRIPTOR = {
    key: "aws-skill-builder",
    displayName: "AWS Skill Builder",
    phase: 1,
    capabilities: {
        catalogSync: true, enrollment: true, progressTracking: true, completionTracking: true,
        certificates: true, ssoLaunch: true, webhooks: false, skillMetadata: true, scorm: false, xapi: true,
    },
};
class AwsSkillBuilderProvider {
    config;
    descriptor = DESCRIPTOR;
    constructor(config) {
        this.config = config;
    }
    async healthCheck() { return { ok: true, detail: "stub" }; }
    async listCourses(opts = {}) {
        void opts;
        return { items: [], total: 0 }; // TODO: Skill Builder catalog API
    }
    async getCourse(externalId) { void externalId; return null; }
    async listLearningPaths(opts = {}) {
        void opts;
        return { items: [] };
    }
    async syncCatalog(opts = {}) {
        void opts;
        const startedAt = new Date();
        return { providerKey: this.descriptor.key, startedAt, finishedAt: startedAt, coursesUpserted: 0, pathsUpserted: 0, coursesRetired: 0, errors: [] };
    }
    async getCourseSkills(externalId) {
        // AWS tags by domain/service/role — strong signal for the Skills Graph reconciler.
        void externalId;
        return [];
    }
    async createLearner(input) { void input; return { externalLearnerId: "stub" }; }
    async enrollLearner(input) {
        return { externalEnrollmentId: "stub", externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "enrolled", enrolledAt: new Date() };
    }
    async getProgress(input) {
        return { externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "in-progress", percent: 0 };
    }
    async getCertificate(input) { void input; return null; }
}
exports.AwsSkillBuilderProvider = AwsSkillBuilderProvider;
exports.awsSkillBuilderFactory = {
    key: DESCRIPTOR.key,
    create: (config) => new AwsSkillBuilderProvider(config),
};
