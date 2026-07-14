import Link from "next/link";
import { Card, courseGlyph, MetricCard, RiskBadge } from "@/components/ui";
import { EnrollButton } from "@/components/EnrollButton";
import { apiGet, apiPost, getContext, type EnrollmentRow, type Recommendation, type SkillGap } from "@/lib/api";

// Learner Home (wireframe "Learner Home"): continue-learning hero, streak + weekly XP,
// achievements, my courses — with the skills-intelligence "why" kept underneath.
export const dynamic = "force-dynamic";

interface GamificationProfile {
  totalXp: number; level: number; nextLevelXp: number; xpThisWeek: number; streak: number;
  week: { day: string; active: boolean; isToday: boolean }[];
  badges: { key: string; name: string; description: string; icon: string; earned: boolean }[];
  badgesEarned: number; badgesTotal: number;
}
interface Cert { id: string; certification: string; issuedAt?: string; status: string }

async function load() {
  const ctx = await getContext();
  const [gap, recs, game, enrollments] = await Promise.all([
    apiGet<SkillGap>(`/users/${ctx.userId}/skill-gap?roleId=${ctx.targetRoleId}`, ctx).catch(() => null),
    apiPost<{ recommendations: Recommendation[] }>(`/users/${ctx.userId}/recommendations/generate?roleId=${ctx.targetRoleId}`, ctx)
      .then((r) => r.recommendations).catch(() => []),
    apiGet<GamificationProfile>(`/gamification/me?userId=${ctx.userId}`, ctx).catch(() => null),
    apiGet<EnrollmentRow[]>(`/users/${ctx.userId}/enrollments`, ctx).catch(() => []),
  ]);
  return { ctx, gap, recs, game, enrollments };
}

export default async function LearnerHome() {
  const { ctx, gap, recs, game, enrollments } = await load();
  const inProgress = enrollments.filter((e) => e.status === "in-progress");
  const continueCourse = inProgress[0] ?? enrollments.find((e) => e.status === "enrolled");
  const readiness = gap ? Math.round(gap.coverage * 100) : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Good morning, {(ctx.userName || "there").split(" ")[0]}</h1>
          <p className="text-sm text-muted">Keep your streak going.</p>
        </div>
      </header>

      {continueCourse && (
        <Card className="border-brand/40 bg-gradient-to-r from-brand/10 to-transparent">
          <p className="text-xs uppercase tracking-wide text-brand">Continue learning</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{continueCourse.course?.title ?? "Your course"}</p>
              <p className="text-xs text-muted">{continueCourse.percent}% complete</p>
            </div>
            <Link href={`/catalog/${continueCourse.courseId}`} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
              Continue →
            </Link>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full bg-brand" style={{ width: `${continueCourse.percent}%` }} />
          </div>
        </Card>
      )}

      {game && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-sm text-muted">This week</p>
            <div className="mt-3 flex justify-between">
              {game.week.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium ${
                    d.active ? "bg-green/20 text-green" : d.isToday ? "ring-1 ring-brand text-brand" : "bg-border/40 text-muted"
                  }`}>
                    {d.active ? "✓" : d.day}
                  </span>
                  <span className="text-[9px] text-muted">{d.day}</span>
                </div>
              ))}
            </div>
          </Card>
          <MetricCard label="XP this week" value={`+${game.xpThisWeek}`} sub={`Level ${game.level} · ${game.totalXp} / ${game.nextLevelXp} XP`} />
          <Card>
            <p className="text-sm text-muted">Achievements</p>
            <div className="mt-2 flex items-center gap-1.5 text-xl">
              {game.badges.slice(0, 6).map((b) => (
                <span key={b.key} title={`${b.name} — ${b.description}`} className={b.earned ? "" : "opacity-25 grayscale"}>{b.icon}</span>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">{game.badgesEarned} of {game.badgesTotal} earned</p>
          </Card>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">My courses</h2>
          <Link href="/my-learning" className="text-xs text-brand">See all →</Link>
        </div>
        {enrollments.length === 0 ? (
          <Card>No enrollments yet. <Link href="/catalog" className="text-brand underline">Browse the catalog →</Link></Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.slice(0, 3).map((e) => (
              <Link key={e.id} href={`/catalog/${e.courseId}`}>
                <Card className="h-full transition hover:border-brand/50">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg text-base ring-1 ring-border">{courseGlyph(e.course?.title ?? "")}</span>
                    <span className="truncate">{e.course?.title ?? "Course"}</span>
                  </p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div className={`h-full ${e.status === "completed" ? "bg-green" : "bg-brand"}`} style={{ width: `${e.percent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted">{e.status === "completed" ? "Completed ✓" : `${e.percent}%`}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {gap && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-muted">Readiness toward {gap.roleName}</h2>
            <RiskBadge risk={readiness! >= 75 ? "green" : readiness! >= 50 ? "amber" : "red"} label={`Readiness ${readiness}%`} />
          </div>
          <p className="mt-2 text-sm">
            {gap.gaps.length} skills missing: <span className="text-muted">{gap.gaps.map((g) => g.name).join(", ")}</span>
          </p>
          <Link href="/skills" className="mt-2 inline-block text-xs text-brand">Full gap analysis →</Link>
        </Card>
      )}

      {recs.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recommended for you</h2>
            <span className="hidden text-xs text-muted sm:block">every recommendation explains the why</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recs.slice(0, 3).map((r) => (
              <Card key={r.courseId} className="flex flex-col">
                <p className="text-xs uppercase tracking-wide text-muted">{r.providerKey}</p>
                <p className="mt-1 font-medium">{r.title}</p>
                <p className="mt-2 flex-1 text-xs text-muted">{r.reason}</p>
                <EnrollButton courseId={r.courseId} className="mt-4 w-full" />
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
