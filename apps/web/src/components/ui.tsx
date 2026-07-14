import type { ReactNode } from "react";

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

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>{children}</div>;
}

export function MetricCard({ label, value, sub, delta, down }: {
  label: string; value: string; sub?: string;
  /** Wireframe-style movement line, e.g. "4 this month". */
  delta?: string; down?: boolean;
}) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="font-display tnum mt-1 text-3xl font-semibold">{value}</p>
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
