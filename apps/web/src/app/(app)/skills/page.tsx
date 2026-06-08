import { Card, Meter, RiskBadge } from "@/components/ui";
import { apiGet, getContext, type SkillGap } from "@/lib/api";

// Skills Intelligence — the user's gap against their target role, live from the Skills Graph.
export const dynamic = "force-dynamic";

async function load() {
  try {
    const ctx = await getContext();
    const gap = await apiGet<SkillGap>(`/users/${ctx.userId}/skill-gap?roleId=${ctx.targetRoleId}`, ctx);
    return { gap, name: ctx.userName };
  } catch {
    return null;
  }
}

export default async function SkillsPage() {
  const data = await load();
  if (!data) return <Card>Could not load skills intelligence.</Card>;
  const { gap, name } = data;
  const cov = Math.round(gap.coverage * 100);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Skills & Gaps</h1>
          <p className="text-sm text-muted">{name} → {gap.roleName}</p>
        </div>
        <RiskBadge risk={cov >= 75 ? "green" : cov >= 50 ? "amber" : "red"} label={`${cov}% coverage`} />
      </header>

      <Card>
        <p className="text-sm text-muted">Required-skill coverage</p>
        <div className="mt-2"><Meter value={cov} /></div>
      </Card>

      <Card className="p-0">
        <div className="border-b border-border p-4 text-sm font-medium">Skill gaps ({gap.gaps.length})</div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-border">
              <th className="p-4 font-medium">Skill</th><th className="font-medium">Importance</th>
              <th className="font-medium">Current → Target</th><th className="p-4 font-medium">Gap</th>
            </tr>
          </thead>
          <tbody>
            {gap.gaps.map((g) => (
              <tr key={g.skillId} className="border-b border-border/60">
                <td className="p-4 font-medium">{g.name}</td>
                <td><span className={g.importance === "required" ? "text-fg" : "text-muted"}>{g.importance}</span></td>
                <td className="text-muted">lvl 1 → {g.targetLevel}</td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
                      <span className="block h-full bg-red" style={{ width: `${(g.deficit / 5) * 100}%` }} />
                    </span>
                    +{g.deficit}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
