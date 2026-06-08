"use strict";
/**
 * Provider registry. Adding a provider = register its factory here. Everything above the PAL
 * resolves connectors by key, never by class. Phase 2–4 connectors register the same way once
 * implemented (see docs/01-system-architecture.md "Provider Integration Architecture").
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProvider = registerProvider;
exports.getProviderFactory = getProviderFactory;
exports.createProvider = createProvider;
exports.listRegisteredProviders = listRegisteredProviders;
const go1_provider_1 = require("./providers/go1.provider");
const open_sesame_provider_1 = require("./providers/open-sesame.provider");
const ms_learn_provider_1 = require("./providers/ms-learn.provider");
const aws_skill_builder_provider_1 = require("./providers/aws-skill-builder.provider");
const internal_kb_provider_1 = require("./providers/internal-kb.provider");
const FACTORIES = new Map();
function registerProvider(factory) {
    FACTORIES.set(factory.key, factory);
}
function getProviderFactory(key) {
    const f = FACTORIES.get(key);
    if (!f)
        throw new Error(`No provider connector registered for key "${key}"`);
    return f;
}
function createProvider(key, config) {
    return getProviderFactory(key).create(config);
}
function listRegisteredProviders() {
    return [...FACTORIES.keys()];
}
// ---- Phase 1 (registered) ----
registerProvider(go1_provider_1.go1Factory);
registerProvider(open_sesame_provider_1.openSesameFactory);
registerProvider(ms_learn_provider_1.msLearnFactory);
registerProvider(aws_skill_builder_provider_1.awsSkillBuilderFactory);
// ---- Phase 4: internal knowledge sources (Confluence/SharePoint/Drive/M365/Notion) ----
internal_kb_provider_1.internalKbFactories.forEach(registerProvider);
// TODO Phase 2: linkedInLearningFactory, courseraFactory, udemyBusinessFactory
// TODO Phase 3: skillsoftFactory, oreillyFactory, dataCampFactory, cybraryFactory
