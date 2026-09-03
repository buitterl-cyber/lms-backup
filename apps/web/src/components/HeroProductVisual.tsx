/** Simplified hero product visual — readiness → gaps → action. */
export function HeroProductVisual() {
  return (
    <div className="relative mx-auto w-full max-w-xl px-0 pb-2 pt-1 sm:px-2 sm:pb-12 sm:pt-2 lg:max-w-none lg:pb-14">
      <div aria-hidden className="mkt-visual-glow pointer-events-none absolute inset-2 hidden rounded-[2rem] sm:block" />

      {/* Readiness chip — below the card frame (desktop/tablet only) */}
      <div className="mkt-float-slow rise rise-d6 absolute bottom-2 end-3 z-20 hidden rounded-2xl border border-border bg-heroPanel px-3.5 py-2.5 text-white shadow-xl sm:end-4 sm:block lg:end-0">
        <p className="text-[10px] uppercase tracking-wider text-white/55">Readiness</p>
        <p className="tnum text-xl font-semibold text-accentOrange">72%</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)]">
        <div className="flex items-center gap-2 border-b border-border bg-bg/80 px-3 py-2 sm:px-4 sm:py-2.5">
          <span className="h-2 w-2 rounded-full bg-red/70" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-amber/70" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-green/70" aria-hidden />
          <span className="ms-2 truncate text-[11px] text-muted">riyadaintel.com / readiness</span>
        </div>

        <div className="space-y-3 p-3.5 sm:space-y-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted sm:text-[11px]">Workforce readiness</p>
              <p className="font-display tnum mt-0.5 text-3xl font-semibold tracking-tight text-accentOrange sm:mt-1 sm:text-5xl">
                72%
              </p>
            </div>
            <div className="flex gap-3 text-end sm:gap-4">
              <div>
                <p className="tnum text-base font-semibold text-fg sm:text-lg">18</p>
                <p className="text-[10px] text-muted sm:text-[11px]">Priority gaps</p>
              </div>
              <div>
                <p className="tnum text-base font-semibold text-amber sm:text-lg">4</p>
                <p className="text-[10px] text-muted sm:text-[11px]">Certs expiring</p>
              </div>
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-border sm:h-2.5">
            <div className="mkt-bar-fill h-full w-[72%] rounded-full bg-gradient-to-r from-accentOrange to-brand" />
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted sm:text-[11px]">Highest-priority gaps</p>
            <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border">
              <GapRow name="SOC 2 Auditing" team="Security" risk="Critical" riskTone="red" />
              <GapRow name="ISO 27001 Awareness" team="All staff" risk="High" riskTone="amber" />
              <GapRow name="Cloud Architecture" team="Solutions Eng." risk="Watch" riskTone="teal" />
            </ul>
          </div>

          <div className="rounded-xl border border-accentOrange/35 bg-gradient-to-br from-accentOrange/10 to-transparent px-3 py-2.5 sm:px-4 sm:py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-accentOrange sm:text-[11px]">Recommended action</p>
            <p className="mt-1 text-sm font-medium leading-snug text-fg">
              Assign ISO 27001 Awareness to 12 people in Security &amp; Ops
            </p>
            <p className="mt-1 hidden text-xs text-muted sm:block">Prioritised by role, requirement and expiry risk · via connected providers</p>
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
        : "border-accentOrange/30 bg-accentOrange/10 text-accentOrange";

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
