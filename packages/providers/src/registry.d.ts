/**
 * Provider registry. Adding a provider = register its factory here. Everything above the PAL
 * resolves connectors by key, never by class. Phase 2–4 connectors register the same way once
 * implemented (see docs/01-system-architecture.md "Provider Integration Architecture").
 */
import type { CourseProvider, ProviderConnectionConfig, ProviderFactory } from "./course-provider.interface";
export declare function registerProvider(factory: ProviderFactory): void;
export declare function getProviderFactory(key: string): ProviderFactory;
export declare function createProvider(key: string, config: ProviderConnectionConfig): CourseProvider;
export declare function listRegisteredProviders(): string[];
