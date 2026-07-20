export type PillarIconKind = "skills" | "career" | "compliance" | "certification" | "ai" | "aggregation";

/** One small illustrative motif per feature-grid pillar — hand-drawn SVG matching the rest of
 *  the app's line-icon style (24x24 viewBox, currentColor stroke), not a new icon library.
 *  Compliance uses the existing green/amber/red status tokens directly (a literal traffic-light
 *  cluster); everything else uses currentColor so each card can tint its own icon. */
export function PillarIcon({ kind, className = "" }: { kind: PillarIconKind; className?: string }) {
  const common = {
    width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true,
  };

  switch (kind) {
    case "skills":
      // A small skills-graph: one resolved node radiating to three others.
      return (
        <svg {...common} className={className}>
          <path d="M12 12 12 5.2M12 12 5.6 16M12 12l6.4 4" />
          <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
          <circle cx="12" cy="5.2" r="2" />
          <circle cx="5.6" cy="16" r="2" />
          <circle cx="18.4" cy="16" r="2" />
        </svg>
      );
    case "career":
      // An ascending trend line with an arrowhead — career progression.
      return (
        <svg {...common} className={className}>
          <path d="M4 18.5 9.5 12l4 3 6-7.5" />
          <path d="M15.5 6h4v4" />
        </svg>
      );
    case "compliance":
      // Literal traffic-light dot cluster, using the existing status tokens — not currentColor.
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
          <circle cx="12" cy="5.5" r="2.3" fill="rgb(239 68 68)" />
          <circle cx="12" cy="12" r="2.3" fill="rgb(245 158 11)" />
          <circle cx="12" cy="18.5" r="2.3" fill="rgb(16 185 129)" />
        </svg>
      );
    case "certification":
      // Award badge with ribbon tails.
      return (
        <svg {...common} className={className}>
          <circle cx="12" cy="8.5" r="5" />
          <path d="M9 12.7 6.8 20l5.2-2.6L17.2 20l-2.2-7.3" />
        </svg>
      );
    case "ai":
      // A four-point sparkle — the common "AI" glyph, drawn as one closed path.
      return (
        <svg {...common} fill="currentColor" stroke="none" className={className}>
          <path d="M12 2.5c.5 3.2 1.3 5.3 2.5 6.5s3.3 2 6.5 2.5c-3.2.5-5.3 1.3-6.5 2.5s-2 3.3-2.5 6.5c-.5-3.2-1.3-5.3-2.5-6.5S6.2 12 3 11.5c3.2-.5 5.3-1.3 6.5-2.5S11.5 5.7 12 2.5z" />
        </svg>
      );
    case "aggregation":
      // Hub-and-spokes: one central node aggregating four sources.
      return (
        <svg {...common} className={className}>
          <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="6" r="1.8" /><circle cx="19.5" cy="6" r="1.8" />
          <circle cx="4.5" cy="18" r="1.8" /><circle cx="19.5" cy="18" r="1.8" />
          <path d="M6 7.2 10 10M18 7.2 14 10M6 16.8 10 14M18 16.8 14 14" />
        </svg>
      );
  }
}
