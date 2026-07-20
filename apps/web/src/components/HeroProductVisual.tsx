/** Simplified hero product visual — readiness → gaps → action.
 *  Floating chips sit outside the frame so they never cover dashboard content. */
export function HeroProductVisual() {
  return (
    <div className="relative mx-auto w-full max-w-xl px-1 pb-12 pt-20 sm:px-2 lg:max-w-none lg:pb-14 lg:pt-24">
      <div aria-hidden className="mkt-visual-glow pointer-events-none absolute inset-2 rounded-[2rem]" />

      {/* Live chip — fully above the card frame */}
      <div className="mkt-float rise rise-d5 absolute left-3 top-2 z-20 hidden max-w-[220px] rounded-2xl border border-border bg-card px-3 py-2 shadow-lg shadow-black/10 sm:left-4 md:block lg:left-0">
        <p className="flex items-center gap-2 text-[11px] font-medium text-fg">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="mkt-pulse absolute inset-0 rounded-full bg-accentTeal opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-accentTeal" />
          </span>
          Gap closed — SOC 2
        </p>
        <p className="mt-0.5 ps-4 text-[10px] text-muted">Security · just now</p>
      </div>

      {/* Readiness chip — fully below the card frame */}
      <div className="mkt-float-slow rise rise-d6 absolute bottom-2 right-3 z-20 hidden rounded-2xl border border-border bg-heroPanel px-3.5 py-2.5 text-white shadow-xl sm:right-4 sm:block lg:right-0">
        <p className="text-[10px] uppercase tracking-wider text-white/55">Readiness</p>
        <p className="tnum text-xl font-semibold text-accentTeal">72%</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)]">
        <div className="flex items-center gap-2 border-b border-border bg-bg/80 px-3 py-2.5 sm:px-4">
          <span className="h-2 w-2 rounded-full bg-red/70" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-amber/70" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-green/70" aria-hidden />
          <span className="ms-2 truncate text-[11px] text-muted">riyadaintel.com / readiness</span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
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

          <div className="h-2.5 overflow-hidden rounded-full bg-border">
            <div className="mkt-bar-fill h-full w-[72%] rounded-full bg-gradient-to-r from-accentTeal to-brand" />
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Highest-priority gaps</p>
            <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border">
              <GapRow name="SOC 2 Auditing" team="Security" risk="Critical" riskTone="red" />
              <GapRow name="ISO 27001 Awareness" team="All staff" risk="High" riskTone="amber" />
              <GapRow name="Cloud Architecture" team="Solutions Eng." risk="Watch" riskTone="teal" />
            </ul>
          </div>

          <div className="rounded-xl border border-accentTeal/35 bg-gradient-to-br from-accentTeal/10 to-transparent px-3.5 py-3 sm:px-4">
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
    <li className="flex items-center justify-between gap-3 bg-card px-3 py-2.5 transition hover:bg-bg sm:px-3.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-fg">{name}</p>
        <p className="truncate text-xs text-muted">{team}</p>
      </div>
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>
        {risk}
      </span>
    </li>
  );
}
