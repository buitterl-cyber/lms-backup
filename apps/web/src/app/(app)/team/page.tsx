import Link from "next/link";
import { Card, MetricCard, RiskBadge } from "@/components/ui";
import { NudgeButton } from "@/components/NudgeButton";
import { ExportCsv } from "@/components/ExportCsv";
import { Avatar } from "@/components/Avatar";
import { isAdmin, apiGet, getContext, type DemoContext, type WorkforceReadiness } from "@/lib/api";
import { AccessDenied } from "@/components/AccessDenied";

// Manager Dashboard (wireframe "Manager Portal"): alerts, KPIs, per-learner progress with the
// Nudge action, activity heatmap, leaderboard, course ratings — plus the original skills
// readiness intelligence below.
export const dynamic = "force-dynamic";

interface TeamDashboard {
  kpis: {
    coursesAssigned: number; coursesAssignedDelta: number; avgCompletion: number;
    avgActiveDays: number; avgActiveDaysDelta: number; certsEarned: number; certsEarnedDelta: number; teamSize: number;
  };
  learners: {
    userId: string; name: string; email: string; activeCourse: string | null; activeCourseId: string | null;
    percent: number | null; started: boolean; dueAt: string | null; lastActiveAt: string | null;
    status: "on_track" | "falling_behind" | "at_risk" | "not_started";
  }[];
  alerts: { kind: string; text: string; userIds: string[]; courseId?: string }[];
  heatmap: number[][];
  ratings: { courseId: string; title: string; rating: number; count: number }[];
  leaderboard: { rank: number; userId: string; name: string; xp: number }[];
}

const STATUS: Record<string, { label: string; risk: "green" | "amber" | "red" }> = {
  on_track: { label: "On Track", risk: "green" },
  falling_behind: { label: "Falling Behind", risk: "amber" },
  at_risk: { label: "At Risk", risk: "red" },
  not_started: { label: "Not Started", risk: "red" },
};

function ago(iso: string | null): string {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

async function load(): Promise<{ ctx: DemoContext; team: TeamDashboard | null; readiness: WorkforceReadiness | null }> {
  const ctx = await getContext();
  const [team, readiness] = await Promise.all([
    apiGet<TeamDashboard>("/workforce/team", ctx).catch(() => null),
    apiGet<WorkforceReadiness>(`/workforce/readiness?deptId=${ctx.departmentId}&roleId=${ctx.targetRoleId}`, ctx).catch(() => null),
  ]);
  return { ctx, team, readiness };
}

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort = "progress" } = await searchParams;
  const { ctx, team, readiness } = await load();
  if (!isAdmin(ctx.roles)) return <AccessDenied />;
  if (!team) return <Card>Could not load the team dashboard.</Card>;
  const learners = [...team.learners].sort((a, b) =>
    sort === "name" ? a.name.localeCompare(b.name) : (b.percent ?? -1) - (a.percent ?? -1),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold">Team Dashboard</h1>
          <p className="text-sm text-muted">Here&apos;s how your team is tracking this week.</p>
        </div>
        <ExportCsv
          filename="team-progress.csv"
          header={["Learner", "Email", "Active course", "Progress %", "Last active", "Status"]}
          rows={team.learners.map((l) => [l.name, l.email, l.activeCourse, l.percent, l.lastActiveAt, l.status])}
        />
      </header>

      {team.alerts.length > 0 && (
        <div className="space-y-2">
          {team.alerts.slice(0, 4).map((a, i) => (
            <Card key={i} className="flex flex-wrap items-center justify-between gap-3 border-amber/40 py-3">
              <p className="text-sm"><span className="mr-2 text-amber">△</span>{a.text}</p>
              {a.userIds.length === 1 ? (
                <NudgeButton learnerId={a.userIds[0]} courseId={a.courseId} ctx={ctx} label="Send nudge →" />
              ) : (
                <span className="text-xs text-muted">nudge learners below</span>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Courses assigned" value={`${team.kpis.coursesAssigned}`}
          delta={`${Math.abs(team.kpis.coursesAssignedDelta)} vs last month`} down={team.kpis.coursesAssignedDelta < 0}
          sub={`across ${team.kpis.teamSize} learners`}
        />
        <MetricCard label="Avg completion" value={`${team.kpis.avgCompletion}%`} sub="no trend yet — history builds monthly" />
        <MetricCard
          label="Avg active days / wk" value={`${team.kpis.avgActiveDays}`}
          delta={`${Math.abs(team.kpis.avgActiveDaysDelta)} vs last month`} down={team.kpis.avgActiveDaysDelta < 0}
        />
        <MetricCard
          label="Certs earned" value={`${team.kpis.certsEarned}`}
          delta={`${Math.abs(team.kpis.certsEarnedDelta)} vs prior 90d`} down={team.kpis.certsEarnedDelta < 0}
          sub="last 90 days"
        />
      </div>

      <Card className="p-0">
        <div className="border-b border-border p-4 text-sm font-medium">
          Team progress <span className="ml-1 text-xs font-normal text-muted">{learners.length} learners · sorted by {sort === "name" ? "name" : "completion"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr className="border-b border-border">
                <th className="p-4 font-medium"><Link href="?sort=name" className="hover:text-fg">Learner ⇅</Link></th><th className="font-medium">Active course</th>
                <th className="font-medium"><Link href="?sort=progress" className="hover:text-fg">Progress ⇅</Link></th><th className="font-medium">Last active</th>
                <th className="font-medium">Status</th><th className="p-4 font-medium" />
              </tr>
            </thead>
            <tbody>
              {learners.map((l) => (
                <tr key={l.userId} className="border-b border-border/60 last:border-0">
                  <td className="p-4">
                    <span className="flex items-center gap-3">
                      <Avatar name={l.name} size={30} />
                      <span>
                        <p className="font-medium">{l.name}</p>
                        {l.dueAt && <p className="text-[11px] text-amber">Due {new Date(l.dueAt).toISOString().slice(0, 10)}</p>}
                      </span>
                    </span>
                  </td>
                  <td className="max-w-[180px] truncate">{l.activeCourse ?? "—"}</td>
                  <td>
                    {l.percent === null ? "—" : !l.started ? (
                      <span className="text-xs text-muted">Not started</span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
                          <span className="block h-full bg-brand" style={{ width: `${l.percent}%` }} />
                        </span>
                        {l.percent}%
                      </span>
                    )}
                  </td>
                  <td className="text-xs text-muted">{ago(l.lastActiveAt)}</td>
                  <td><RiskBadge risk={STATUS[l.status].risk} label={STATUS[l.status].label} /></td>
                  <td className="p-4 text-right">
                    {l.status !== "on_track" && (
                      <NudgeButton learnerId={l.userId} courseId={l.activeCourseId} ctx={ctx} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="text-sm font-medium text-muted">Activity heatmap <span className="font-normal">· last 12 weeks</span></h2>
          <div className="mt-4 flex gap-1">
            {team.heatmap.map((week, wi) => (
              <div key={wi} className="flex flex-1 flex-col gap-1">
                {week.map((n, di) => (
                  <div
                    key={di}
                    className={`aspect-square w-full rounded-sm ${n === 0 ? "bg-border/50" : n === 1 ? "bg-brand/25" : n < 4 ? "bg-brand/55" : "bg-brand"}`}
                    title={`${n} activities`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-muted">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-border/50" /> None</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand/25" /> Light</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand/55" /> Mid</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand" /> High</span>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-medium text-muted">Leaderboard <span className="font-normal">· this month</span></h2>
          <div className="mt-3 space-y-2">
            {team.leaderboard.length === 0 && <p className="text-xs text-muted">No XP earned yet this month.</p>}
            {team.leaderboard.map((e) => (
              <div key={e.userId} className="flex items-center gap-3 text-sm">
                <span className={`w-5 text-center text-xs font-semibold ${e.rank === 1 ? "text-amber" : "text-muted"}`}>{e.rank}</span>
                <Avatar name={e.name} size={26} />
                <span className="flex-1 truncate">{e.name}</span>
                <span className="tnum text-xs font-medium text-brand">{e.xp.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-medium text-muted">Course ratings</h2>
          <div className="mt-3 space-y-2">
            {team.ratings.length === 0 && <p className="text-xs text-muted">No ratings yet.</p>}
            {team.ratings.slice(0, 5).map((r) => (
              <div key={r.courseId} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{r.title}</span>
                <span className={`text-xs font-semibold ${r.rating < 3.5 ? "text-red" : "text-fg"}`}>{r.rating.toFixed(1)} / 5</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {readiness && (
        <Card className="p-0">
          <div className="border-b border-border p-4 text-sm font-medium">
            Skills readiness · {readiness.roleName}
            <span className="ml-2 text-xs font-normal text-muted">{readiness.readyForRole} of {readiness.teamSize} ready · avg coverage {Math.round(readiness.avgCoverage * 100)}%</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="p-4 font-medium">Skill shortage</th><th className="font-medium">Covered</th>
                  <th className="font-medium">Short</th><th className="p-4 font-medium">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {readiness.shortages.map((s) => (
                  <tr key={s.skillId} className="border-b border-border/60 last:border-0">
                    <td className="p-4 font-medium">{s.name}</td>
                    <td>{s.peopleCovered}</td>
                    <td>{s.peopleShort}</td>
                    <td className="p-4">{Math.round(s.coverage * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
