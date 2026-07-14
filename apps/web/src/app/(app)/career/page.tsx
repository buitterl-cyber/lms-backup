"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { apiGet, apiPost, getContext, type CareerPlanResult, type DemoContext, type SkillGap } from "@/lib/api";

// Career Intelligence — current role → target role → a prerequisite-ordered roadmap with
// estimated time and cost. Interactive (generate), live from the engine.
export default function CareerPage() {
  const [ctx, setCtx] = useState<DemoContext | null>(null);
  const [targetName, setTargetName] = useState<string>("");
  const [plan, setPlan] = useState<CareerPlanResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getContext()
      .then((c) => {
        setCtx(c);
        return apiGet<SkillGap>(`/users/${c.userId}/skill-gap?roleId=${c.targetRoleId}`, c).then((g) => setTargetName(g.roleName));
      })
      .catch(() => {});
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
        <h1 className="font-display text-2xl font-semibold">Career Studio</h1>
        <p className="text-sm text-muted">A roadmap from where you are to where you want to be.</p>
      </header>

      <Card className="flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs text-muted">Current</p>
          <p className="font-medium">{ctx?.jobTitle || "—"}</p>
        </div>
        <span className="text-brand">→</span>
        <div>
          <p className="text-xs text-muted">Target</p>
          <p className="font-medium">{targetName || "…"}</p>
        </div>
        <button onClick={generate} disabled={!ctx || loading} className="ml-auto rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {loading ? "Building roadmap…" : plan ? "Regenerate" : "Generate roadmap"}
        </button>
      </Card>

      {plan && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card><p className="text-sm text-muted">Steps</p><p className="mt-1 text-3xl font-semibold">{plan.steps.length}</p></Card>
            <Card><p className="text-sm text-muted">Estimated time</p><p className="mt-1 text-3xl font-semibold">~{plan.estMonths} mo</p></Card>
            <Card><p className="text-sm text-muted">Estimated cost</p><p className="mt-1 text-3xl font-semibold">${(plan.estCostCents / 100).toFixed(0)}</p></Card>
          </div>
          <Card className="p-0">
            <div className="border-b border-border p-4 text-sm font-medium">Learning roadmap (prerequisites first)</div>
            <ol>
              {plan.steps.map((s) => (
                <li key={s.order} className="flex items-center gap-4 border-b border-border/60 p-4 text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs text-brand">{s.order}</span>
                  <span className="flex-1 font-medium">{s.courseTitle}</span>
                  <span className="text-xs uppercase text-muted">{s.providerKey}</span>
                  <span className="text-xs text-muted">{Math.round(s.estMinutes / 60)}h · ${(s.estCostCents / 100).toFixed(0)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}
