import { Card, MetricCard, Meter } from "@/components/ui";
import { apiGet, getContext, type WorkforceReadiness } from "@/lib/api";

// Workforce / Manager view — org-level skills intelligence: where the department is short, who's
// ready, and which skills are single-points-of-failure.
export const dynamic = "force-dynamic";

async function load() {
  try {
    const ctx = await getContext();
    return await apiGet<WorkforceReadiness>(`/workforce/readiness?deptId=${ctx.departmentId}&roleId=${ctx.targetRoleId}`, ctx);
  } catch {
    return null;
  }
}

export default async function TeamPage() {
  const w = await load();
  if (!w) return <Card>Could not load workforce readiness.</Card>;
  const avg = Math.round(w.avgCoverage * 100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Team Readiness</h1>
        <p className="text-sm text-muted">Department workforce intelligence against {w.roleName}.</p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Team size" value={`${w.teamSize}`} />
        <MetricCard label="Ready for role" value={`${w.readyForRole}`} sub="meet all required skills" />
        <Card>
          <p className="text-sm text-muted">Avg required coverage</p>
          <p className="mt-1 text-3xl font-semibold">{avg}%</p>
          <div className="mt-2"><Meter value={avg} /></div>
        </Card>
      </div>

      {w.singlePointsOfFailure.length > 0 && (
        <Card>
          <h2 className="text-sm font-medium text-muted">Single points of failure</h2>
          <p className="mt-1 text-xs text-muted">Skills held by only one person — succession risk.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {w.singlePointsOfFailure.map((s) => (
              <span key={s} className="rounded-full bg-red/10 px-3 py-1 text-xs text-red ring-1 ring-red/30">{s}</span>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-0">
        <div className="border-b border-border p-4 text-sm font-medium">Training priorities (skill shortages)</div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-border">
              <th className="p-4 font-medium">Skill</th><th className="font-medium">Covered</th>
              <th className="font-medium">Short</th><th className="p-4 font-medium">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {w.shortages.map((s) => (
              <tr key={s.skillId} className="border-b border-border/60">
                <td className="p-4 font-medium">{s.name}</td>
                <td>{s.peopleCovered}</td>
                <td>{s.peopleShort}</td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
                      <span className="block h-full bg-brand" style={{ width: `${Math.round(s.coverage * 100)}%` }} />
                    </span>
                    {Math.round(s.coverage * 100)}%
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
