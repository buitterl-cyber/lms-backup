import type { AnchorHTMLAttributes, ButtonHTMLAttributes, FormHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { Sparkline } from "@/components/charts";

export type ButtonVariant = "primary" | "secondary" | "outline" | "success" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BUTTON_BASE =
  "inline-flex items-center justify-center rounded-lg font-medium transition duration-200 ease-out will-change-transform disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white shadow-sm shadow-brand/20 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-md hover:shadow-brand/30",
  secondary: "border border-border shadow-sm shadow-black/5 hover:-translate-y-0.5 hover:bg-card hover:shadow-md hover:shadow-black/10 dark:shadow-black/20",
  // Tinted-outline action (join/nudge/review-toggle style) — same brand token, no fill.
  outline: "border border-brand/40 text-brand hover:-translate-y-0.5 hover:bg-brand/10 hover:shadow-sm hover:shadow-brand/15",
  // Terminal states (e.g. EnrollButton once it's succeeded/failed) — the same green/red
  // RiskBadge already uses, so a completed action reads the same way everywhere.
  success: "border border-green/30 bg-green/15 text-green",
  danger: "border border-red/30 bg-red/15 text-red",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-sm",
};

type ButtonOwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };

type ButtonAsLink = ButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> & { href: string };

/** Shared CTA look for the whole app — one place for the button that used to be copy-pasted
 *  (and drifted, e.g. courses/page.tsx's rounded-xl vs everyone else's rounded-lg) across ~15
 *  files. Built entirely from existing tokens (bg-brand, border-border, green/red) — no new
 *  colors. Renders a native <button>, or — when `href` is given — a Next <Link> for in-app
 *  routes, falling back to a plain <a> for external URLs / `/api/*` endpoints / target="_blank"
 *  so Next never tries to prefetch a redirect (OAuth kickoff, provider launch links, etc.). */
export function Button({ variant = "primary", size = "md", className = "", href, children, ...rest }: ButtonAsButton | ButtonAsLink) {
  const cls = `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`.trim();
  if (href !== undefined) {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    const external = /^https?:\/\//.test(href) || href.startsWith("/api/") || anchorProps.target === "_blank";
    if (external) {
      return (
        <a href={href} className={cls} {...anchorProps}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...anchorProps}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}

type Risk = "green" | "amber" | "red";

const RISK_STYLES: Record<Risk, string> = {
  green: "bg-green/15 text-green border-green/30",
  amber: "bg-amber/15 text-amber border-amber/30",
  red: "bg-red/15 text-red border-red/30",
};

/** Green/amber/red indicator used across compliance, certification, and readiness surfaces. */
export function RiskBadge({ risk, label }: { risk: Risk; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${RISK_STYLES[risk]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? risk.toUpperCase()}
    </span>
  );
}

export type CardTone = "default" | "brand" | "amber" | "green" | "none";
export type CardPadding = "none" | "sm" | "md" | "lg" | "xl";
export type CardRadius = "lg" | "xl" | "2xl";

const CARD_TONE: Record<CardTone, string> = {
  default: "border-border bg-card",
  // Tinted borders/fills for callouts (promo tiles, success banners) — same green/amber
  // tokens RiskBadge and Button's success variant already use.
  brand: "border-brand/30 bg-card",
  amber: "border-amber/40 bg-amber/10",
  green: "border-green/40 bg-green/10",
  // Outline only, no fill — nested sub-panels inside another Card (e.g. a list item within
  // a card that shouldn't get its own bg-card square).
  none: "border-border",
};

const CARD_PADDING: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
  xl: "p-6",
};

const CARD_RADIUS: Record<CardRadius, string> = {
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
};

type CardOwnProps = {
  children: ReactNode;
  className?: string;
  tone?: CardTone;
  padding?: CardPadding;
  radius?: CardRadius;
  /** Frosted-glass variant (bg-card/70 + backdrop-blur) — the sidebar identity card, floating
   *  panels over the aurora wash. Only meaningful with the default tone. */
  translucent?: boolean;
  /** Subtle lift + shadow on hover — marketing grids and clickable surfaces. Off by default so
   *  dense dashboard cards stay still. */
  interactive?: boolean;
  as?: "div" | "form" | "section";
};

type CardProps = CardOwnProps & Omit<FormHTMLAttributes<HTMLFormElement>, "className" | "children">;

/** Shared surface for every bordered content container in the app — was previously
 *  hand-rolled per file with drifting radii/padding (rounded-xl p-3 here, rounded-2xl there).
 *  Built entirely from existing tokens; `tone`/`padding`/`radius`/`translucent` cover the real
 *  variation found across the app instead of one-off className overrides. `as="section"` keeps
 *  semantic sectioning on public content pages; `as="form"` lets a Card double as its own form. */
export function Card({ children, className = "", tone = "default", padding = "lg", radius = "xl", translucent = false, interactive = false, as = "div", ...rest }: CardProps) {
  const toneClass = translucent ? "border-border bg-card/70 backdrop-blur" : CARD_TONE[tone];
  const interactClass = interactive
    ? "transition duration-200 ease-out will-change-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/40 hover:border-brand/25"
    : "";
  const cls = `border ${CARD_RADIUS[radius]} ${toneClass} ${CARD_PADDING[padding]} ${interactClass} ${className}`.trim();
  if (as === "form") {
    return (
      <form className={cls} {...rest}>
        {children}
      </form>
    );
  }
  if (as === "section") {
    return <section className={cls}>{children}</section>;
  }
  return <div className={cls}>{children}</div>;
}

export function MetricCard({ label, value, sub, delta, down, trend }: {
  label: string; value: string; sub?: string;
  /** Wireframe-style movement line, e.g. "4 this month". */
  delta?: string; down?: boolean;
  /** Optional [previous, current] (or a few points) for an inline sparkline — only pass this
   *  when the caller actually has the raw numbers (e.g. current - delta), never a fabricated
   *  series. Omit entirely when there's no real history, same as `delta`/`sub` today. */
  trend?: number[];
}) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="font-display tnum text-3xl font-semibold">{value}</p>
        {trend && trend.length >= 2 && <Sparkline points={trend} down={down} />}
      </div>
      {delta && <p className={`tnum mt-1 text-xs font-medium ${down ? "text-red" : "text-green"}`}>{down ? "↓" : "↑"} {delta}</p>}
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </Card>
  );
}

/** Wireframe course icons (⚛️ ☁️ 🐍 …), derived from the course's own subject. */
export function courseGlyph(text: string): string {
  const t = text.toLowerCase();
  if (/(security|cyber|iso ?2|soc ?2|gdpr|complian|phish|identity)/.test(t)) return "🛡️";
  if (/(azure|cloud|aws|kubernetes|devops|expressroute)/.test(t)) return "☁️";
  if (/(python|machine learning|\bml\b|data|analytics)/.test(t)) return "🐍";
  if (/(react|javascript|typescript|frontend|web dev)/.test(t)) return "⚛️";
  if (/(network|routing|infrastructure)/.test(t)) return "🌐";
  if (/(terraform|automation|script)/.test(t)) return "⚙️";
  if (/(lead|manage|business|sales|communicat)/.test(t)) return "📈";
  return "📘";
}

/** A 0..100 progress meter, used for readiness and audit-readiness. */
export function Meter({ value }: { value: number }) {
  const color = value >= 75 ? "bg-green" : value >= 50 ? "bg-amber" : "bg-red";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/** A 0..100 progress ring for headline single-stat surfaces (e.g. skill coverage) — the same
 *  SVG-arc technique Avatar's level ring already uses, standalone and bigger. Color follows the
 *  green/amber/red risk convention (or an explicit brand/accentTeal override) so it reads
 *  consistently with RiskBadge/Meter, not as a one-off gauge. */
export function ProgressRing({
  value, size = 96, label, sub, color,
}: { value: number; size?: number; label?: string; sub?: string; color?: "auto" | "brand" | "accentTeal" }) {
  const pct = Math.min(100, Math.max(0, value));
  const strokeColor =
    color === "brand" ? "rgb(var(--brand))"
    : color === "accentTeal" ? "rgb(var(--accent-teal))"
    : pct >= 75 ? "rgb(16 185 129)" : pct >= 50 ? "rgb(245 158 11)" : "rgb(239 68 68)";
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--border))" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={strokeColor} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display tnum text-2xl font-semibold">{label ?? `${Math.round(pct)}%`}</p>
        {sub && <p className="text-[10px] text-muted">{sub}</p>}
      </div>
    </div>
  );
}

export type ChevronDirection = "right" | "left" | "up" | "down";

const CHEVRON_ROTATION: Record<ChevronDirection, string> = {
  right: "",
  down: "rotate-90",
  left: "rotate-180",
  up: "-rotate-90",
};

/** One chevron glyph, rotated per `direction` — replaces the ad hoc Unicode arrows/triangles
 *  (→ ← ‹ ▸ ▾) scattered around the app with a single icon matching the hand-drawn SVG line-icon
 *  style already used in Topbar/ThemeSwitcher/LocaleSwitcher. left/right also mirror correctly
 *  under RTL via the rtl: variant (driven by the <html dir> layout.tsx already resolves), since
 *  "back"/"forward" are reading-direction-relative but "up"/"down" aren't. */
export function Chevron({ direction = "right", className = "" }: { direction?: ChevronDirection; className?: string }) {
  const mirror = direction === "left" || direction === "right" ? "rtl:-scale-x-100" : "";
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden
      className={`inline-block shrink-0 transition-transform ${CHEVRON_ROTATION[direction]} ${mirror} ${className}`.trim()}
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/** Shared table shell + cell padding — was previously hand-rolled per page with drifting
 *  spacing (p-4 on first/last cell only in some tables, every cell in others). Every <Th>/<Td>
 *  gets the same horizontal padding regardless of position. */
export function Table({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <table className={`w-full text-sm ${className}`.trim()}>{children}</table>;
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead className="text-start text-xs text-muted">{children}</thead>;
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-start font-medium ${className}`.trim()}>{children}</th>;
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`.trim()}>{children}</td>;
}

/** One pulsing placeholder bar — the atom every loading.tsx skeleton is built from. Pass a
 *  height/width via className (h-3 w-24, etc.); it never guesses a size on its own. */
export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-border/60 ${className}`.trim()} />;
}

/** Placeholder matching MetricCard's shape (label / big number / delta line). */
export function SkeletonMetric() {
  return (
    <Card>
      <SkeletonLine className="h-3 w-20" />
      <SkeletonLine className="mt-3 h-7 w-14" />
      <SkeletonLine className="mt-2 h-3 w-24" />
    </Card>
  );
}

/** Placeholder matching a Card+Table shape (header bar + N rows of bars). */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <Card padding="none">
      <div className="border-b border-border p-4">
        <SkeletonLine className="h-4 w-40" />
      </div>
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <SkeletonLine className="h-3 flex-[2]" />
            <SkeletonLine className="h-3 flex-1" />
            <SkeletonLine className="h-3 flex-1" />
            <SkeletonLine className="h-3 flex-1" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Placeholder matching a course/catalog card (icon box + title + tag row). */
export function SkeletonCourseCard() {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <SkeletonLine className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <SkeletonLine className="h-4 w-3/4" />
          <SkeletonLine className="mt-2 h-3 w-1/2" />
        </div>
      </div>
      <SkeletonLine className="mt-4 h-3 w-1/3" />
    </Card>
  );
}

export type StateIconKind = "empty" | "alert" | "search" | "course" | "trophy" | "star" | "badge";

/** Small line-icon set for empty states / error boundaries — matches the hand-drawn SVG style
 *  used everywhere else (Topbar, ThemeSwitcher, Chevron), so these never fall back to emoji. */
export function StateIcon({ kind, className = "" }: { kind: StateIconKind; className?: string }) {
  const paths: Record<StateIconKind, ReactNode> = {
    empty: (
      <>
        <path d="M3 9.5 12 4l9 5.5" />
        <path d="M4 9v9a1 1 0 0 0 1 1h5v-6h4v6h5a1 1 0 0 0 1-1V9" />
      </>
    ),
    alert: (
      <>
        <path d="M12 9v4" />
        <path d="M10.3 3.9 2.6 17a1.8 1.8 0 0 0 1.55 2.7h15.7A1.8 1.8 0 0 0 21.4 17L13.7 3.9a1.8 1.8 0 0 0-3.4 0z" />
        <path d="M12 16.2h.01" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m20 20-4.35-4.35" />
      </>
    ),
    course: (
      <>
        <path d="M3.5 5.5c2.3-1 5.3-1 8.5 0v13c-3.2-1-6.2-1-8.5 0z" />
        <path d="M20.5 5.5c-2.3-1-5.3-1-8.5 0v13c3.2-1 6.2-1 8.5 0z" />
      </>
    ),
    trophy: (
      <>
        <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
        <path d="M7 5H4.5v1.5a3 3 0 0 0 3 3M17 5h2.5v1.5a3 3 0 0 1-3 3" />
        <path d="M12 13v3.2M9 20h6M10.2 20v-2.8M13.8 20v-2.8" />
      </>
    ),
    star: (
      <path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3-4.8-4.3 6.4-.6z" />
    ),
    badge: (
      <>
        <circle cx="12" cy="8.5" r="5" />
        <path d="M9 12.7 6.8 20l5.2-2.6L17.2 20l-2.2-7.3" />
      </>
    ),
  };
  return (
    <svg
      width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}
    >
      {paths[kind]}
    </svg>
  );
}

/** Consistent empty state: icon + title + optional description + optional next-action —
 *  replaces the one-line "No X yet" text that was inconsistent about offering a CTA. */
export function EmptyState({
  icon = "empty", title, description, action, className = "",
}: { icon?: StateIconKind; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-3 py-8 text-center ${className}`.trim()}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bg text-muted ring-1 ring-border">
        <StateIcon kind={icon} />
      </span>
      <div>
        <p className="font-medium">{title}</p>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
