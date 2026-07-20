const NAV = ["Learner", "Catalog", "Skills", "Compliance"] as const;

const METRICS = [
  { label: "Team readiness", value: "72%", tone: "text-heroTeal" },
  { label: "Open gaps", value: "18", tone: "text-heroAmber" },
  { label: "Certs expiring", value: "4", tone: "text-heroCoral" },
] as const;

const GAPS = [
  { name: "SOC2 Auditing", role: "Security Analyst", risk: "red" as const, pct: 35 },
  { name: "ISO 27001 Awareness", role: "All staff", risk: "amber" as const, pct: 62 },
  { name: "Cloud Architecture", role: "Solutions Eng.", risk: "green" as const, pct: 88 },
];

const ACTIVITY = [
  { color: "bg-heroTeal", text: "Gap closed — SOC2 Auditing", meta: "Amir K · 5m" },
  { color: "bg-heroAmber", text: "Cert renewed — CISSP", meta: "Lena R · 12m" },
  { color: "bg-heroCoral", text: "New hire mapped — NY office", meta: "Just now" },
];

const RISK: Record<"red" | "amber" | "green", string> = {
  red: "bg-red/20 text-red border-red/30",
  amber: "bg-amber/20 text-amber border-amber/30",
  green: "bg-green/20 text-green border-green/30",
};

/** High-fidelity coded mock of the real product UI for the marketing hero — browser chrome,
 *  app sidebar, metrics, gap table, and activity feed. Real HTML/CSS (no screenshot asset)
 *  so it stays crisp and token-driven; denser than the previous illustration-style mock. */
export function HeroDashboardMock() {
  return (
    <div className="rise rise-d3 relative mx-auto w-full max-w-xl">
      {/* Soft depth halo — token teal/navy, not a hard-coded glow color */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-[1.75rem] bg-gradient-to-br from-heroTeal/20 via-transparent to-brand/10 blur-2xl"
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-heroPanel shadow-2xl shadow-black/45 ring-1 ring-white/5">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-black/25 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-heroCoral" />
            <span className="h-2.5 w-2.5 rounded-full bg-heroAmber" />
            <span className="h-2.5 w-2.5 rounded-full bg-heroTeal" />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-white/5 px-2.5 py-1 ring-1 ring-white/10">
            <span className="text-[10px] text-white/35">🔒</span>
            <span className="truncate text-[11px] text-white/55">app.riyadaintel.com/learner</span>
          </div>
        </div>

        {/* App chrome — topbar */}
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-[10px] font-bold text-white">
              R
            </span>
            <span className="text-[12px] font-semibold text-white">RiyadaIntel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="hidden rounded-full bg-heroTeal/15 px-2 py-0.5 text-[10px] font-medium text-heroTeal sm:inline">
              Live demo
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/80">
              AK
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[72px_1fr] sm:grid-cols-[88px_1fr]">
          {/* Mini sidebar */}
          <aside className="border-r border-white/10 bg-black/20 py-3">
            <nav className="flex flex-col gap-0.5 px-1.5">
              {NAV.map((item, i) => (
                <span
                  key={item}
                  className={`rounded-md px-2 py-1.5 text-[10px] leading-tight ${
                    i === 0 ? "bg-white/10 font-medium text-white" : "text-white/45"
                  }`}
                >
                  {item}
                </span>
              ))}
            </nav>
          </aside>

          {/* Main panel */}
          <div className="min-w-0 p-3 sm:p-3.5">
            {/* Metric strip */}
            <div className="grid grid-cols-3 gap-2">
              {METRICS.map((m, i) => (
                <div
                  key={m.label}
                  className={`rise rounded-lg bg-white/[0.04] px-2 py-2 ring-1 ring-white/10 ${
                    i === 0 ? "rise-d4" : i === 1 ? "rise-d5" : "rise-d6"
                  }`}
                >
                  <p className="truncate text-[9px] text-white/45">{m.label}</p>
                  <p className={`tnum mt-0.5 text-base font-semibold tracking-tight sm:text-lg ${m.tone}`}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Continue-learning strip — mirrors the real learner resume hero */}
            <div className="mt-2.5 rounded-lg bg-brand/80 px-3 py-2.5 ring-1 ring-white/10">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[9px] font-medium uppercase tracking-wider text-white/60">
                    Continue learning
                  </p>
                  <p className="mt-0.5 truncate text-[12px] font-semibold text-white">
                    ISO 27001 Awareness
                  </p>
                </div>
                <span className="tnum shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold text-white">
                  🔥 4d
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-[62%] rounded-full bg-brandGold" />
              </div>
              <p className="tnum mt-1 text-[9px] text-white/65">62% · Module 3 of 5</p>
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-[1.15fr_0.85fr]">
              {/* Gap table */}
              <div className="rounded-lg bg-white/[0.03] p-2 ring-1 ring-white/10">
                <p className="text-[10px] font-medium text-white/55">Priority gaps</p>
                <ul className="mt-1.5 space-y-1.5">
                  {GAPS.map((g) => (
                    <li key={g.name} className="rounded-md bg-black/20 px-2 py-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[11px] font-medium text-white">{g.name}</p>
                        <span
                          className={`shrink-0 rounded-full border px-1.5 py-px text-[8px] font-semibold uppercase ${RISK[g.risk]}`}
                        >
                          {g.risk}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[9px] text-white/40">{g.role}</p>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`hero-bar h-full rounded-full ${
                            g.risk === "green" ? "bg-green" : g.risk === "amber" ? "bg-amber" : "bg-red"
                          }`}
                          style={{ width: `${g.pct}%`, animationDelay: `${g.pct * 4}ms` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Activity */}
              <div className="rounded-lg bg-white/[0.03] p-2 ring-1 ring-white/10">
                <p className="text-[10px] font-medium text-white/55">Activity</p>
                <ul className="mt-1.5 space-y-2">
                  {ACTIVITY.map((a) => (
                    <li key={a.text} className="flex items-start gap-1.5">
                      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${a.color}`} />
                      <div className="min-w-0">
                        <p className="text-[11px] leading-snug text-white/90">{a.text}</p>
                        <p className="text-[9px] text-white/40">{a.meta}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
