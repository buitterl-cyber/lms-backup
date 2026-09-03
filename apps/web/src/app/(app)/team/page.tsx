import Link from "next/link";
import {
  Card, Chevron, EmptyState, MetricCard, PriorityList, PriorityRow, PriorityTone,
  ReadinessBar, ReadinessScore, RecommendedActionCard, RiskBadge, Table, Td, Th, Thead,
} from "@/components/ui";
import { NudgeButton } from "@/components/NudgeButton";
import { JoinCourseButton } from "@/components/JoinCourseButton";
import { AddTeamMemberForm } from "@/components/AddTeamMemberForm";
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
  teamCourses: { courseId: string; title: string; learnerCount: number; managerEnrolled: boolean }[];
}

const STATUS: Record<string, { label: string; risk: "green" | "amber" | "red" }> = {
  on_track: { label: "On Track", risk: "green" },
  falling_behind: { label: "Falling Behind", risk: "amber" },
  at_risk: { label: "At Risk", risk: "red" },
  not_started: { label: "Not Started", risk: "red" },
};

// Demo fallback, same role this plays on /compliance: /workforce/team and /workforce/readiness
// both correctly require a real session (2026-07-21 tenant-context hardening — see
// tenant.middleware.ts), so anonymous/demo visitors get a 401, not broken data. Rather than a
// hard error card, show a representative snapshot so the page always renders something sensible.
const DEMO: TeamDashboard = {
  kpis: { coursesAssigned: 14, coursesAssignedDelta: 2, avgCompletion: 61, avgActiveDays: 3.4, avgActiveDaysDelta: 0.6, certsEarned: 5, certsEarnedDelta: 2, teamSize: 6 },
  learners: [
    { userId: "demo-1", name: "Jordan K", email: "jordan@example.com", activeCourse: "Cloud Security Fundamentals", activeCourseId: null, percent: 72, started: true, dueAt: null, lastActiveAt: new Date(Date.now() - 86_400_000).toISOString(), status: "on_track" },
    { userId: "demo-2", name: "Lena R", email: "lena@example.com", activeCourse: "ISO 27001 Lead Implementer", activeCourseId: null, percent: 100, started: true, dueAt: null, lastActiveAt: new Date(Date.now() - 2 * 86_400_000).toISOString(), status: "on_track" },
    { userId: "demo-3", name: "Marcus T", email: "marcus@example.com", activeCourse: "AWS Security Essentials", activeCourseId: null, percent: 34, started: true, dueAt: new Date(Date.now() + 3 * 86_400_000).toISOString(), lastActiveAt: new Date(Date.now() - 9 * 86_400_000).toISOString(), status: "falling_behind" },
    { userId: "demo-4", name: "Priya S", email: "priya@example.com", activeCourse: null, activeCourseId: null, percent: null, started: false, dueAt: null, lastActiveAt: new Date(Date.now() - 16 * 86_400_000).toISOString(), status: "at_risk" },
    { userId: "demo-5", name: "Owen B", email: "owen@example.com", activeCourse: "Terraform on Azure", activeCourseId: null, percent: 58, started: true, dueAt: null, lastActiveAt: new Date(Date.now() - 3 * 86_400_000).toISOString(), status: "on_track" },
    { userId: "demo-6", name: "Sofia N", email: "sofia@example.com", activeCourse: null, activeCourseId: null, percent: null, started: false, dueAt: null, lastActiveAt: new Date(Date.now() - 21 * 86_400_000).toISOString(), status: "not_started" },
  ],
  alerts: [
    { kind: "behind", text: "Marcus T is falling behind on Terraform on Azure.", userIds: ["demo-3"] },
    { kind: "not_started", text: "Priya S and Sofia N haven't started their assigned training.", userIds: ["demo-4", "demo-6"] },
  ],
  heatmap: Array.from({ length: 12 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => (w > 8 ? [0, 2, 6, 8, 3, 5, 1][d] : w > 5 ? [0, 1, 3, 2, 4, 0, 0][d] : 0)),
  ),
  ratings: [
    { courseId: "demo-c1", title: "Cloud Security Fundamentals", rating: 4.6, count: 12 },
    { courseId: "demo-c2", title: "ISO 27001 Lead Implementer", rating: 4.2, count: 8 },
    { courseId: "demo-c3", title: "AWS Security Essentials", rating: 3.4, count: 5 },
  ],
  leaderboard: [
    { rank: 1, userId: "demo-2", name: "Lena R", xp: 4820 },
    { rank: 2, userId: "demo-1", name: "Jordan K", xp: 3910 },
    { rank: 3, userId: "demo-5", name: "Owen B", xp: 2760 },
  ],
  teamCourses: [
    { courseId: "demo-c1", title: "Cloud Security Fundamentals", learnerCount: 4, managerEnrolled: false },
    { courseId: "demo-c2", title: "ISO 27001 Lead Implementer", learnerCount: 3, managerEnrolled: true },
  ],
};

const DEMO_READINESS: WorkforceReadiness = {
  roleName: "Cloud Security Engineer",
  teamSize: 6,
  avgCoverage: 0.58,
  readyForRole: 2,
  shortages: [
    { skillId: "demo-s1", name: "ISO 27001", peopleCovered: 2, peopleShort: 4, coverage: 0.33 },
    { skillId: "demo-s2", name: "AWS Security", peopleCovered: 3, peopleShort: 3, coverage: 0.5 },
    { skillId: "demo-s3", name: "Terraform", peopleCovered: 4, peopleShort: 2, coverage: 0.67 },
  ],
  singlePointsOfFailure: ["ISO 27001"],
};

function ago(iso: string | null): string {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

async function load(): Promise<{ ctx: DemoContext; team: TeamDashboard; readiness: WorkforceReadiness }> {
  const ctx = await getContext();
  const [team, readiness] = await Promise.all([
    apiGet<TeamDashboard>("/workforce/team", ctx).catch(() => DEMO),
    apiGet<WorkforceReadiness>(`/workforce/readiness?deptId=${ctx.departmentId}&roleId=${ctx.targetRoleId}`, ctx).catch(() => DEMO_READINESS),
  ]);
  return { ctx, team, readiness };
}

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort = "progress" } = await searchParams;
  const { ctx, team, readiness } = await load();
  if (!isAdmin(ctx.roles)) return <AccessDenied />;
  const learners = [...team.learners].sort((a, b) =>
    sort === "name" ? a.name.localeCompare(b.name) : (b.percent ?? -1) - (a.percent ?? -1),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold sm:text-2xl">Team Dashboard</h1>
          <p className="text-sm text-muted">Here&apos;s how your team is tracking this week.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <AddTeamMemberForm ctx={ctx} courses={team.teamCourses.map((c) => ({ courseId: c.courseId, title: c.title }))} />
          <ExportCsv
            filename="team-progress.csv"
            header={["Learner", "Email", "Active course", "Progress %", "Last active", "Status"]}
            rows={team.learners.map((l) => [l.name, l.email, l.activeCourse, l.percent, l.lastActiveAt, l.status])}
          />
        </div>
      </header>

      {team.alerts.length > 0 && (
        <div className="space-y-2">
          {team.alerts.slice(0, 4).map((a, i) => (
            <Card key={i} className="flex flex-wrap items-center justify-between gap-3 border-amber/40 py-3">
              <p className="text-sm"><span className="me-2 text-amber">△</span>{a.text}</p>
              {a.userIds.length === 1 ? (
                <NudgeButton learnerId={a.userIds[0]} courseId={a.courseId} ctx={ctx} label="Send nudge" />
              ) : (
                <span className="text-xs text-muted">nudge learners below</span>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          label="Courses assigned" value={`${team.kpis.coursesAssigned}`}
          delta={`${Math.abs(team.kpis.coursesAssignedDelta)} vs last month`} down={team.kpis.coursesAssignedDelta < 0}
          sub={`across ${team.kpis.teamSize} learners`}
          trend={[team.kpis.coursesAssigned - team.kpis.coursesAssignedDelta, team.kpis.coursesAssigned]}
        />
        <MetricCard label="Avg completion" value={`${team.kpis.avgCompletion}%`} sub="no trend yet — history builds monthly" />
        <MetricCard
          label="Avg active days / wk" value={`${team.kpis.avgActiveDays}`}
          delta={`${Math.abs(team.kpis.avgActiveDaysDelta)} vs last month`} down={team.kpis.avgActiveDaysDelta < 0}
          trend={[team.kpis.avgActiveDays - team.kpis.avgActiveDaysDelta, team.kpis.avgActiveDays]}
        />
        <MetricCard
          label="Certs earned" value={`${team.kpis.certsEarned}`}
          delta={`${Math.abs(team.kpis.certsEarnedDelta)} vs prior 90d`} down={team.kpis.certsEarnedDelta < 0}
          sub="last 90 days"
          trend={[team.kpis.certsEarned - team.kpis.certsEarnedDelta, team.kpis.certsEarned]}
        />
      </div>

      <Card padding="none">
        <div className="border-b border-border p-4 text-sm font-medium">
          Team progress{" "}
          <span className="ms-1 text-xs font-normal text-muted">
            {learners.length} learners · sorted by {sort === "name" ? "name" : "completion"}
          </span>
        </div>

        {learners.length === 0 && (
          <EmptyState
            icon="empty"
            title="No team members yet"
            description="Add someone above and their progress will show up here."
          />
        )}

        {learners.length > 0 && (
        <>
        {/* Mobile: stacked cards so nothing is clipped */}
        <ul className="divide-y divide-border/60 md:hidden">
          {learners.map((l) => (
            <li key={l.userId} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar name={l.name} size={30} />
                  <span className="min-w-0">
                    <p className="truncate font-medium">{l.name}</p>
                    <p className="truncate text-xs text-muted">{l.activeCourse ?? "No active course"}</p>
                  </span>
                </span>
                <RiskBadge risk={STATUS[l.status].risk} label={STATUS[l.status].label} />
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-muted">
                <span>
                  {l.percent === null ? "—" : !l.started ? (
                    "Not started"
                  ) : (
                    <span className="inline-flex items-center gap-2 text-fg">
                      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
                        <span className="block h-full bg-brand" style={{ width: `${l.percent}%` }} />
                      </span>
                      {l.percent}%
                    </span>
                  )}
                </span>
                <span>Last active {ago(l.lastActiveAt)}</span>
              </div>
              {l.status !== "on_track" && (
                <div className="flex justify-end">
                  <NudgeButton learnerId={l.userId} courseId={l.activeCourseId} ctx={ctx} />
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Desktop/tablet table */}
        <div className="hidden overflow-x-auto md:block">
          <Table className="min-w-[640px]">
            <Thead>
              <tr className="border-b border-border">
                <Th>
                  <Link href="?sort=name" className={`inline-flex items-center gap-1 hover:text-fg ${sort === "name" ? "font-semibold text-fg" : ""}`}>
                    Learner {sort === "name" && <Chevron direction="up" className="text-brand" />}
                  </Link>
                </Th>
                <Th>Active course</Th>
                <Th>
                  <Link href="?sort=progress" className={`inline-flex items-center gap-1 hover:text-fg ${sort !== "name" ? "font-semibold text-fg" : ""}`}>
                    Progress {sort !== "name" && <Chevron direction="down" className="text-brand" />}
                  </Link>
                </Th>
                <Th>Last active</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </Thead>
            <tbody>
              {learners.map((l) => (
                <tr key={l.userId} className="border-b border-border/60 last:border-0">
                  <Td>
                    <span className="flex items-center gap-3">
                      <Avatar name={l.name} size={30} />
                      <span>
                        <p className="font-medium">{l.name}</p>
                        {l.dueAt && <p className="text-[11px] text-amber">Due {new Date(l.dueAt).toISOString().slice(0, 10)}</p>}
                      </span>
                    </span>
                  </Td>
                  <Td className="max-w-[180px] truncate">{l.activeCourse ?? "—"}</Td>
                  <Td>
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
                  </Td>
                  <Td className="text-xs text-muted">{ago(l.lastActiveAt)}</Td>
                  <Td><RiskBadge risk={STATUS[l.status].risk} label={STATUS[l.status].label} /></Td>
                  <Td className="text-end">
                    {l.status !== "on_track" && (
                      <NudgeButton learnerId={l.userId} courseId={l.activeCourseId} ctx={ctx} />
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        </>
        )}
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
            {team.leaderboard.length === 0 && (
              <EmptyState
                icon="trophy" title="The leaderboard is wide open"
                description="Complete a course this month to claim the top spot." className="py-4"
              />
            )}
            {team.leaderboard.map((e) => (
              <div key={e.userId} className="flex items-center gap-3 text-sm">
                <span className={`w-5 text-center text-xs font-semibold ${e.rank === 1 ? "text-amber" : "text-muted"}`}>{e.rank}</span>
                <span className={e.rank === 1 ? "rounded-full ring-2 ring-amber ring-offset-2 ring-offset-card" : ""}>
                  <Avatar name={e.name} size={26} />
                </span>
                <span className="flex-1 truncate">{e.name}</span>
                <span className="tnum text-xs font-medium text-brand">{e.xp.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-medium text-muted">Course ratings</h2>
          <div className="mt-3 space-y-2">
            {team.ratings.length === 0 && (
              <EmptyState
                icon="star" title="No ratings yet"
                description="Once your team rates a course, the best (and worst) show up here." className="py-4"
              />
            )}
            {team.ratings.slice(0, 5).map((r) => (
              <div key={r.courseId} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{r.title}</span>
                <span className={`text-xs font-semibold ${r.rating < 3.5 ? "text-red" : "text-fg"}`}>{r.rating.toFixed(1)} / 5</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {team.teamCourses.length > 0 && (
        <Card padding="none">
          <div className="border-b border-border p-4 text-sm font-medium">
            Your team&apos;s courses
            <span className="ms-2 text-xs font-normal text-muted">optionally take any of these yourself</span>
          </div>
          <div className="divide-y divide-border/60">
            {team.teamCourses.map((c) => (
              <div key={c.courseId} className="flex items-center justify-between gap-3 p-4 text-sm">
                <span className="truncate">{c.title}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-muted">
                    {c.learnerCount} learner{c.learnerCount === 1 ? "" : "s"}
                  </span>
                  {c.managerEnrolled ? (
                    <span className="text-xs font-medium text-green">Joined ✓</span>
                  ) : (
                    <JoinCourseButton courseId={c.courseId} ctx={ctx} />
                  )}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {readiness && (() => {
        const pct = Math.round(readiness.avgCoverage * 100);
        const sorted = [...readiness.shortages].sort((a, b) => b.peopleShort - a.peopleShort);
        const top = sorted[0];
        const toneFor = (coverage: number): PriorityTone => (coverage < 0.5 ? "critical" : coverage < 0.75 ? "high" : "watch");
        return (
          <Card padding="none">
            <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <ReadinessScore label={`Skills readiness · ${readiness.roleName}`} value={pct} />
                <div className="flex gap-4 text-end">
                  <div>
                    <p className="tnum text-base font-semibold text-fg sm:text-lg">{readiness.readyForRole}</p>
                    <p className="text-[10px] text-muted sm:text-[11px]">of {readiness.teamSize} ready</p>
                  </div>
                  {readiness.singlePointsOfFailure.length > 0 && (
                    <div>
                      <p className="tnum text-base font-semibold text-amber sm:text-lg">{readiness.singlePointsOfFailure.length}</p>
                      <p className="text-[10px] text-muted sm:text-[11px]">Single points of failure</p>
                    </div>
                  )}
                </div>
              </div>

              <ReadinessBar value={pct} />

              {sorted.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted sm:text-[11px]">Highest-priority skill gaps</p>
                  <PriorityList>
                    {sorted.slice(0, 5).map((s) => (
                      <PriorityRow
                        key={s.skillId}
                        title={s.name}
                        subtitle={`${s.peopleCovered} covered · ${s.peopleShort} short`}
                        tone={toneFor(s.coverage)}
                      />
                    ))}
                  </PriorityList>
                </div>
              )}

              {top && (
                <RecommendedActionCard
                  headline={`Assign ${top.name} to ${top.peopleShort} people in ${readiness.roleName}`}
                  subtext={`Prioritised by coverage gap · ${Math.round(top.coverage * 100)}% currently covered`}
                />
              )}
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
