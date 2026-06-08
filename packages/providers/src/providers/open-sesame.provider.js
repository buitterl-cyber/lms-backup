"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openSesameFactory = exports.OpenSesameProvider = void 0;
const DESCRIPTOR = {
    key: "open-sesame",
    displayName: "OpenSesame",
    phase: 1,
    capabilities: {
        catalogSync: true, enrollment: true, progressTracking: true, completionTracking: true,
        certificates: true, ssoLaunch: true, webhooks: true, skillMetadata: true, scorm: true, xapi: true,
    },
};
class OpenSesameProvider {
    config;
    descriptor = DESCRIPTOR;
    constructor(config) {
        this.config = config;
    }
    async healthCheck() { return { ok: true, detail: "stub" }; }
    async listCourses(opts = {}) {
        void opts;
        return { items: [], total: 0 }; // TODO: GET /v1/courses?modified_since=
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
    async getCourseSkills(externalId) { void externalId; return []; }
    async createLearner(input) { void input; return { externalLearnerId: "stub" }; }
    async enrollLearner(input) {
        return { externalEnrollmentId: "stub", externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "enrolled", enrolledAt: new Date() };
    }
    async getProgress(input) {
        return { externalLearnerId: input.externalLearnerId, externalCourseId: input.externalCourseId, status: "in-progress", percent: 0 };
    }
    async getCertificate(input) { void input; return null; }
}
exports.OpenSesameProvider = OpenSesameProvider;
exports.openSesameFactory = {
    key: DESCRIPTOR.key,
    create: (config) => new OpenSesameProvider(config),
};
