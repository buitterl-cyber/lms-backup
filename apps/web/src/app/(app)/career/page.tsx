"use client";

import { useEffect, useState } from "react";
import {
  Button, Card, PriorityList, PriorityRow, PriorityTone,
  ReadinessBar, ReadinessScore, RecommendedActionCard, SkeletonLine, SkeletonTable,
} from "@/components/ui";
import { apiGet, apiPost, getContext, type CareerPlanResult, type DemoContext, type SkillGap } from "@/lib/api";

// Career Intelligence — current role → target role → a prerequisite-ordered roadmap with
// estimated time and cost. Interactive (generate), live from the engine.
export default function CareerPage() {
  const [ctx, setCtx] = useState<DemoContext | null>(null);
  const [gap, setGap] = useState<SkillGap | null>(null);
  const [plan, setPlan] = useState<CareerPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  // Distinguishes "haven't fetched yet" from "fetched" — without this, the current/target card
  // shows placeholder dashes and the whole readiness card pops in abruptly once data arrives.
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    getContext()
      .then((c) => {
        setCtx(c);
        return apiGet<SkillGap>(`/users/${c.userId}/skill-gap?roleId=${c.targetRoleId}`, c).then(setGap);
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  async function generate() {
    if (!ctx) return;
    setLoading(true);
    try {
      setPlan(await apiPost<CareerPlanResult>(`/users/${ctx.userId}/career-plan`, ctx, { targetRoleId: ctx.targetRoleId }));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Career Studio</h1>
        <p className="text-sm text-muted">A roadmap from where you are to where you want to be.</p>
      </header>

      {initialLoading ? (
        <Card className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="min-w-0 flex-1"><SkeletonLine className="h-3 w-14" /><SkeletonLine className="mt-2 h-4 w-32" /></div>
          <div className="min-w-0 flex-1"><SkeletonLine className="h-3 w-14" /><SkeletonLine className="mt-2 h-4 w-32" /></div>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="min-w-0">
            <p className="text-xs text-muted">Current</p>
            <p className="font-medium">{ctx?.jobTitle || "—"}</p>
          </div>
          <span aria-hidden className="hidden text-brand sm:inline-block rtl:-scale-x-100">→</span>
          <div className="min-w-0">
            <p className="text-xs text-muted">Target</p>
            <p className="font-medium">{gap?.roleName || "…"}</p>
          </div>
          <Button onClick={generate} disabled={!ctx || loading} className="w-full sm:ms-auto sm:w-auto">
            {loading ? "Building roadmap…" : plan ? "Regenerate" : "Generate roadmap"}
          </Button>
        </Card>
      )}

      {/* Skills readiness — same teal readiness-card treatment used on /skills, /compliance,
          /team, /learner: headline %, gradient bar, priority gap list, one recommended action.
          This is the same skill-gap data the roadmap below is generated from. */}
      {initialLoading && <SkeletonTable rows={3} />}
      {!initialLoading && gap && (() => {
        const pct = Math.round(gap.coverage * 100);
        const sorted = [...gap.gaps].sort((a, b) => b.deficit - a.deficit);
        const top = sorted.find((g) => g.importance === "required") ?? sorted[0];
        const toneFor = (g: (typeof sorted)[number]): PriorityTone =>
          g.importance === "required" ? (g.deficit >= 3 ? "critical" : "high") : "watch";
        return (
          <Card padding="none">
            <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
              <ReadinessScore label={`Readiness for ${gap.roleName}`} value={pct} />
              <ReadinessBar value={pct} />

              {sorted.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted sm:text-[11px]">Highest-priority skill gaps</p>
                  <PriorityList>
                    {sorted.slice(0, 5).map((g) => (
                      <PriorityRow
                        key={g.skillId}
                        title={g.name}
                        subtitle={`lvl ${g.currentLevel} → ${g.targetLevel} · ${g.importance}`}
                        tone={toneFor(g)}
                      />
                    ))}
                  </PriorityList>
                </div>
              )}

              {top && (
                <RecommendedActionCard
                  headline={`Close the ${top.name} gap — lvl ${top.currentLevel} → ${top.targetLevel}`}
                  subtext="This is what the roadmap below is prioritised to close first"
                />
              )}
            </div>
          </Card>
        );
      })()}

      {plan && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <Card><p className="text-sm text-muted">Steps</p><p className="mt-1 text-3xl font-semibold">{plan.steps.length}</p></Card>
            <Card><p className="text-sm text-muted">Estimated time</p><p className="mt-1 text-3xl font-semibold">~{plan.estMonths} mo</p></Card>
            <Card><p className="text-sm text-muted">Estimated cost</p><p className="mt-1 text-3xl font-semibold">${(plan.estCostCents / 100).toFixed(0)}</p></Card>
          </div>
          <Card padding="none">
            <div className="border-b border-border p-4 text-sm font-medium">Learning roadmap (prerequisites first)</div>
            <ol>
              {plan.steps.map((s) => (
                <li key={s.order} className="flex flex-col gap-2 border-b border-border/60 p-4 text-sm sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs text-brand">{s.order}</span>
                    <span className="min-w-0 flex-1 font-medium">{s.courseTitle}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 ps-10 text-xs text-muted sm:ms-auto sm:ps-0">
                    <span className="uppercase">{s.providerKey}</span>
                    <span>{Math.round(s.estMinutes / 60)}h · ${(s.estCostCents / 100).toFixed(0)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}
