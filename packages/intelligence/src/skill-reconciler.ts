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
  confidence: number; // 0..1
  method: "exact" | "alias" | "token" | "embedding" | "none";
}

export interface ReconcileOptions {
  aliases?: Map<string, string>; // normalized alias -> canonical skill id
  embeddingSimilarity?: (rawNormalized: string, skill: Skill) => number; // 0..1
  threshold?: number; // default 0.6
}

export function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function reconcileSkill(
  raw: string,
  canonical: Skill[],
  opts: ReconcileOptions = {},
): ReconcileResult {
  const norm = normalize(raw);
  const threshold = opts.threshold ?? 0.6;

  // Tier 1a: exact name match
  for (const s of canonical) {
    if (normalize(s.name) === norm) {
      return { canonicalSkillId: s.id, confidence: 1, method: "exact" };
    }
  }
  // Tier 1b: alias table
  const aliasHit = opts.aliases?.get(norm);
  if (aliasHit) return { canonicalSkillId: aliasHit, confidence: 0.95, method: "alias" };

  // Tier 2a: token overlap (Jaccard)
  let best: ReconcileResult = { canonicalSkillId: null, confidence: 0, method: "none" };
  const rawTokens = new Set(norm.split(" ").filter(Boolean));
  for (const s of canonical) {
    const sTokens = new Set(normalize(s.name).split(" ").filter(Boolean));
    const inter = [...rawTokens].filter((t) => sTokens.has(t)).length;
    const union = new Set([...rawTokens, ...sTokens]).size;
    const jaccard = union === 0 ? 0 : inter / union;
    if (jaccard > best.confidence) {
      best = { canonicalSkillId: s.id, confidence: jaccard, method: "token" };
    }
  }

  // Tier 2b: embedding similarity (if provided) can beat token overlap
  if (opts.embeddingSimilarity) {
    for (const s of canonical) {
      const sim = opts.embeddingSimilarity(norm, s);
      if (sim > best.confidence) {
        best = { canonicalSkillId: s.id, confidence: sim, method: "embedding" };
      }
    }
  }

  if (best.confidence >= threshold) return best;
  return { canonicalSkillId: null, confidence: best.confidence, method: "none" };
}
