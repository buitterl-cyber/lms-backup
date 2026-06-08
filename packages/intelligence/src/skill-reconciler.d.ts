/**
 * Skill Reconciler — maps a provider's raw skill/tag string to a canonical Skill.
 *
 * Tier 1: exact / alias normalized match.
 * Tier 2: token overlap + optional embedding cosine similarity (injected, so this stays pure).
 * Below the confidence threshold => null (goes to a human-review queue).
 *
 * The vector step is injected as `embeddingSimilarity` so this module has zero side effects and
 * is fully unit-testable; the API wires a real embedding provider behind it.
 */
import type { Skill } from "./types";
export interface ReconcileResult {
    canonicalSkillId: string | null;
    confidence: number;
    method: "exact" | "alias" | "token" | "embedding" | "none";
}
export interface ReconcileOptions {
    aliases?: Map<string, string>;
    embeddingSimilarity?: (rawNormalized: string, skill: Skill) => number;
    threshold?: number;
}
export declare function normalize(s: string): string;
export declare function reconcileSkill(raw: string, canonical: Skill[], opts?: ReconcileOptions): ReconcileResult;
