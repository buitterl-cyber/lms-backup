/**
 * Single source of truth for provider display names and the "Powered by X" attribution used
 * anywhere a course card/detail view shows content that may come from a connected provider
 * (GO1, Microsoft Learn, AWS Skill Builder, Cybrary, …) instead of internally-authored content.
 * Keeping this in one place means adding a provider is a one-line change here, not a hunt across
 * every page that renders a course.
 *
 * Plain server-safe exports only (no "use client") — this gets imported from Server Component
 * pages (catalog list, course detail). The image components that need an onError handler live
 * in ./CourseImage.tsx instead, since an event handler can't cross the server/client boundary.
 */
export const PROVIDER_LABEL: Record<string, string> = {
  go1: "GO1",
  "ms-learn": "Microsoft Learn",
  aws: "AWS Skill Builder",
  "aws-skill-builder": "AWS Skill Builder",
  cybrary: "Cybrary",
  oreilly: "O'Reilly",
  "open-sesame": "OpenSesame",
  learnworlds: "LearnWorlds",
  "ai-generated": "AI Generated",
};

export function providerLabel(key: string): string {
  return PROVIDER_LABEL[key] ?? key;
}

/** "Powered by {Provider}" pill — the per-course attribution the catalog needs once content
 *  isn't all from one source. Internally-authored content (isInternal / "ai-generated") skips
 *  the "Powered by" framing since there's no external party to attribute. */
export function ProviderAttribution({ providerKey, className = "" }: { providerKey: string; className?: string }) {
  const isInternal = providerKey === "ai-generated" || providerKey === "internal";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-bg px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted ring-1 ring-border ${className}`}
    >
      {isInternal ? providerLabel(providerKey) : `Powered by ${providerLabel(providerKey)}`}
    </span>
  );
}
