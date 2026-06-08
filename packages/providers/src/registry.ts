/**
 * Provider registry. Adding a provider = register its factory here. Everything above the PAL
 * resolves connectors by key, never by class. Phase 2–4 connectors register the same way once
 * implemented (see docs/01-system-architecture.md "Provider Integration Architecture").
 */

import type { CourseProvider, ProviderConnectionConfig, ProviderFactory } from "./course-provider.interface";
import { go1Factory } from "./providers/go1.provider";
import { openSesameFactory } from "./providers/open-sesame.provider";
import { msLearnFactory } from "./providers/ms-learn.provider";
import { awsSkillBuilderFactory } from "./providers/aws-skill-builder.provider";
import { internalKbFactories } from "./providers/internal-kb.provider";
import { learnWorldsFactory } from "./providers/learnworlds.provider";

const FACTORIES = new Map<string, ProviderFactory>();

export function registerProvider(factory: ProviderFactory): void {
  FACTORIES.set(factory.key, factory);
}

export function getProviderFactory(key: string): ProviderFactory {
  const f = FACTORIES.get(key);
  if (!f) throw new Error(`No provider connector registered for key "${key}"`);
  return f;
}

export function createProvider(key: string, config: ProviderConnectionConfig): CourseProvider {
  return getProviderFactory(key).create(config);
}

export function listRegisteredProviders(): string[] {
  return [...FACTORIES.keys()];
}

// ---- Phase 1 (registered) ----
registerProvider(go1Factory);
registerProvider(openSesameFactory);
registerProvider(msLearnFactory);
registerProvider(awsSkillBuilderFactory);
// ---- Phase 4: internal knowledge sources (Confluence/SharePoint/Drive/M365/Notion) ----
internalKbFactories.forEach(registerProvider);
// ---- Phase 2 ----
registerProvider(learnWorldsFactory);
// TODO Phase 2: linkedInLearningFactory, courseraFactory, udemyBusinessFactory
// TODO Phase 3: skillsoftFactory, oreillyFactory, dataCampFactory, cybraryFactory
