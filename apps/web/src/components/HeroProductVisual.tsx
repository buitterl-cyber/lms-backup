/** Simplified hero product visual — one workflow: readiness → priority gaps → risk → action.
 *  Intentionally sparse vs the old dense dashboard mock so laptop widths stay readable. */
export function HeroProductVisual() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-3 rounded-2xl bg-accentTeal/15 blur-2xl sm:-inset-4"
      />

      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* App chrome — minimal */}
        <div className="flex items-center gap-2 border-b border-border bg-bg px-3 py-2.5 sm:px-4">
          <span className="h-2 w-2 rounded-full bg-red/70" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-amber/70" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-green/70" aria-hidden />
          <span className="ms-2 truncate text-[11px] text-muted">riyadaintel.com / readiness</span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* Step 1 — readiness score */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Workforce readiness</p>
              <p className="font-display tnum mt-1 text-4xl font-semibold tracking-tight text-accentTeal sm:text-5xl">
                72%
              </p>
            </div>
            <div className="flex gap-4 text-right">
              <div>
                <p className="tnum text-lg font-semibold text-fg">18</p>
                <p className="text-[11px] text-muted">Priority gaps</p>
              </div>
              <div>
                <p className="tnum text-lg font-semibold text-amber">4</p>
                <p className="text-[11px] text-muted">Certs expiring</p>
              </div>
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-border">
            <div className="h-full w-[72%] rounded-full bg-accentTeal" />
          </div>

          {/* Step 2–3 — priority gaps + risk */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Highest-priority gaps</p>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
              <GapRow name="SOC 2 Auditing" team="Security" risk="Critical" riskTone="red" />
              <GapRow name="ISO 27001 Awareness" team="All staff" risk="High" riskTone="amber" />
              <GapRow name="Cloud Architecture" team="Solutions Eng." risk="Watch" riskTone="teal" />
            </ul>
          </div>

          {/* Step 4 — recommended action */}
          <div className="rounded-lg border border-accentTeal/30 bg-accentTeal/5 px-3.5 py-3 sm:px-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-accentTeal">Recommended action</p>
            <p className="mt-1 text-sm font-medium text-fg">
              Assign ISO 27001 Awareness to 12 people in Security &amp; Ops
            </p>
            <p className="mt-1 text-xs text-muted">Prioritised by role requirement and expiry risk · via connected providers</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GapRow({
  name,
  team,
  risk,
  riskTone,
}: {
  name: string;
  team: string;
  risk: string;
  riskTone: "red" | "amber" | "teal";
}) {
  const tone =
    riskTone === "red"
      ? "border-red/30 bg-red/10 text-red"
      : riskTone === "amber"
        ? "border-amber/30 bg-amber/10 text-amber"
        : "border-accentTeal/30 bg-accentTeal/10 text-accentTealInk";

  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-3.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-fg">{name}</p>
        <p className="truncate text-xs text-muted">{team}</p>
      </div>
      <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>
        {risk}
      </span>
    </li>
  );
}
