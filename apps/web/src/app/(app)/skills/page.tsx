import {
  Card, PriorityList, PriorityRow, PriorityTone,
  ReadinessBar, ReadinessScore, RecommendedActionCard, RiskBadge,
} from "@/components/ui";
import { SkillRadar } from "@/components/charts";
import { apiGet, getContext, type SkillGap } from "@/lib/api";

// Skills Intelligence — the user's gap against their target role, live from the Skills Graph.
export const dynamic = "force-dynamic";

// Demo fallback for anonymous/demo visitors, same role as the DEMO constants on /compliance and
// /team: /users/:userId/skill-gap requires a real session (2026-07-21 tenant-context hardening),
// so a logged-out visitor gets a 401, not broken data. Show a representative snapshot instead of
// a hard error card.
const DEMO_GAP: SkillGap = {
  roleId: "demo-role",
  roleName: "Cloud Security Engineer",
  coverage: 0.58,
  gaps: [
    { skillId: "demo-s1", name: "ISO 27001", deficit: 3, importance: "required", targetLevel: 4, currentLevel: 1 },
    { skillId: "demo-s2", name: "AWS Security", deficit: 2, importance: "required", targetLevel: 4, currentLevel: 2 },
    { skillId: "demo-s3", name: "Terraform", deficit: 1, importance: "preferred", targetLevel: 3, currentLevel: 2 },
  ],
};

async function load() {
  try {
    const ctx = await getContext();
    const gap = await apiGet<SkillGap>(`/users/${ctx.userId}/skill-gap?roleId=${ctx.targetRoleId}`, ctx).catch(() => DEMO_GAP);
    return { gap, name: ctx.userName };
  } catch {
    return { gap: DEMO_GAP, name: "Demo" };
  }
}

export default async function SkillsPage() {
  const data = await load();
  const { gap, name } = data;
  const cov = Math.round(gap.coverage * 100);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold sm:text-2xl">Skills & Gaps</h1>
          <p className="text-sm text-muted">{name} → {gap.roleName}</p>
        </div>
        <RiskBadge risk={cov >= 75 ? "green" : cov >= 50 ? "amber" : "red"} label={`${cov}% coverage`} />
      </header>

      {gap.gaps.length >= 3 && (
        <Card>
          <p className="text-sm text-muted">Current vs. target, by skill</p>
          <SkillRadar data={gap.gaps.map((g) => ({ skill: g.name, current: g.currentLevel, target: g.targetLevel }))} />
        </Card>
      )}

      {(() => {
        const sorted = [...gap.gaps].sort((a, b) => b.deficit - a.deficit);
        const top = sorted.find((g) => g.importance === "required") ?? sorted[0];
        const toneFor = (g: (typeof sorted)[number]): PriorityTone =>
          g.importance === "required" ? (g.deficit >= 3 ? "critical" : "high") : "watch";
        return (
          <Card padding="none">
            <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
              <ReadinessScore label="Required-skill coverage" value={cov} />
              <ReadinessBar value={cov} />

              {sorted.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted sm:text-[11px]">
                    Skill gaps ({gap.gaps.length})
                  </p>
                  <PriorityList>
                    {sorted.map((g) => (
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
                  subtext="Prioritised by importance and coverage deficit · every completed course recomputes this live"
                />
              )}
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
