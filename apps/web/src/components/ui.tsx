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

export function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </Card>
  );
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
