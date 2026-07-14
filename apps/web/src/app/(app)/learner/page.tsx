import Link from "next/link";
import { Card, courseGlyph, RiskBadge } from "@/components/ui";
import { EnrollButton } from "@/components/EnrollButton";
import { apiGet, apiPost, getContext, type EnrollmentRow, type Recommendation, type SkillGap } from "@/lib/api";

// Learner Dashboard (14-Jul spec): greeting + date, flat-navy resume hero with streak,
// weekly activity strip, My Courses, XP & level bar, achievements, certificates strip,
// notifications panel — every section with an honest empty state.
export const dynamic = "force-dynamic";

interface GamificationProfile {
  totalXp: number; level: number; nextLevelXp: number; xpThisWeek: number; streak: number;
  week: { day: string; active: boolean; isToday: boolean }[];
  badges: { key: string; name: string; description: string; icon: string; earned: boolean }[];
  badgesEarned: number; badgesTotal: number;
}
interface CertRow { id: string; name: string; issuedAt: string; fileUrl: string | null; status: string }
interface NotifRow { id: string; kind: string; payload: Record<string, unknown>; readAt: string | null; createdAt: string }
interface ModuleRow { position: number; completed: boolean; locked: boolean; title: string }

const NOTIF_LABEL: Record<string, string> = {
  nudge: "Reminder",
  forum_reply: "Forum reply",
  peer_review: "Review returned",
  certification_renewal: "Certification renewal",
  compliance_alert: "Compliance alert",
  assignment: "Training assigned",
};

function ago(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

function statusPill(e: EnrollmentRow & { dueAt?: string | null }) {
  if (e.status === "completed") return <RiskBadge risk="green" label="Completed" />;
  if (e.dueAt) {
    const days = Math.ceil((new Date(e.dueAt).getTime() - Date.now()) / 86_400_000);
    if (days <= 5) return <RiskBadge risk={days < 0 ? "red" : "amber"} label={days < 0 ? `Overdue ${-days}d` : `Due in ${days}d`} />;
  }
  return <RiskBadge risk={e.status === "in-progress" ? "green" : "amber"} label={e.status === "in-progress" ? "In Progress" : "Not started"} />;
}

async function load() {
  const ctx = await getContext();
  const [game, enrollments, certs, notifs, gap, recs] = await Promise.all([
    apiGet<GamificationProfile>(`/gamification/me?userId=${ctx.userId}`, ctx).catch(() => null),
    apiGet<(EnrollmentRow & { dueAt?: string | null })[]>(`/users/${ctx.userId}/enrollments`, ctx).catch(() => []),
    apiGet<CertRow[]>(`/certifications/user/${ctx.userId}`, ctx).catch(() => [] as CertRow[]),
    apiGet<NotifRow[]>(`/users/${ctx.userId}/notifications`, ctx).catch(() => [] as NotifRow[]),
    apiGet<SkillGap>(`/users/${ctx.userId}/skill-gap?roleId=${ctx.targetRoleId}`, ctx).catch(() => null),
    apiPost<{ recommendations: Recommendation[] }>(`/users/${ctx.userId}/recommendations/generate?roleId=${ctx.targetRoleId}`, ctx)
      .then((r) => r.recommendations).catch(() => [] as Recommendation[]),
  ]);
  const resume =
    enrollments.find((e) => e.status === "in-progress") ??
    enrollments.find((e) => e.status === "enrolled");
  const modules = resume
    ? await apiGet<ModuleRow[]>(`/courses/${resume.courseId}/modules`, ctx).catch(() => [] as ModuleRow[])
    : [];
  return { ctx, game, enrollments, certs, notifs, gap, recs, resume, modules };
}

export default async function LearnerDashboard() {
  const { ctx, game, enrollments, certs, notifs, recs, resume, modules } = await load();
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const currentModule = modules.find((m) => !m.completed && !m.locked);
  const remainingMin = resume?.course && resume.percent < 100
    ? Math.round(((100 - resume.percent) / 100) * ((resume as { course?: { durationMinutes?: number } }).course?.durationMinutes ?? 60))
    : null;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <header>
        <h1 className="font-display text-2xl font-semibold">Good morning, {(ctx.userName || "there").split(" ")[0]}</h1>
        <p className="text-sm text-muted">{today} · keep your streak going.</p>
      </header>

      {/* Resume hero — flat navy (bg-brand = #1E3A6E on the default skin), gold CTA, streak corner */}
      {resume ? (
        <div className="relative overflow-hidden rounded-xl bg-brand p-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">Continue learning</p>
              <p className="font-display mt-1 truncate text-xl font-semibold">{resume.course?.title ?? "Your course"}</p>
              <p className="mt-1 text-sm text-white/80">
                {currentModule ? `Module ${currentModule.position}${modules.length ? ` of ${modules.length}` : ""} · ${currentModule.title}` : "Pick up where you left off"}
              </p>
            </div>
            {game && game.streak > 0 && (
              <span className="tnum shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                🔥 {game.streak} day streak
              </span>
            )}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="h-[5px] w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-[#F5A623]" style={{ width: `${resume.percent}%` }} />
              </div>
              <p className="tnum mt-1.5 text-xs text-white/75">
                {resume.percent}% complete{remainingMin ? ` · ~${remainingMin >= 60 ? `${Math.round(remainingMin / 60)}h` : `${remainingMin} min`} remaining` : ""}
              </p>
            </div>
            <Link
              href={`/catalog/${resume.courseId}`}
              className="shrink-0 rounded-lg bg-[#F5A623] px-5 py-2.5 text-sm font-semibold text-[#3A2A05]"
            >
              Continue →
            </Link>
          </div>
        </div>
      ) : (
        <Card>
          <p className="font-medium">No courses in progress yet.</p>
          <p className="mt-1 text-sm text-muted">Pick your first course and it will appear here.</p>
          <Link href="/catalog" className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">Browse the catalog →</Link>
        </Card>
      )}

      {/* Weekly strip + XP & level */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-muted">This week</p>
          {game ? (
            <div className="mt-3 flex justify-between">
              {game.week.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className={`tnum flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-medium ${
                    d.active ? "bg-green/15 text-green" : d.isToday ? "ring-1 ring-brand text-brand" : "bg-border/40 text-muted"
                  }`}>
                    {d.active ? "✓" : d.day}
                  </span>
                  <span className="text-[9px] text-muted">{d.day}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted">Activity appears here once you start learning.</p>
          )}
        </Card>
        <Card>
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-muted">XP this week</p>
            {game && <p className="tnum text-xs text-muted">Level {game.level} → {game.level + 1}</p>}
          </div>
          <p className="font-display tnum mt-1 text-3xl font-semibold">+{game?.xpThisWeek ?? 0}</p>
          {game && (
            <>
              <div className="mt-3 h-[5px] w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(Math.min(1, Math.max(0, (game.totalXp - (game.level - 1) ** 2 * 100) / (game.nextLevelXp - (game.level - 1) ** 2 * 100))) * 100)}%`,
                    background: "linear-gradient(to right, rgb(var(--brand)), rgb(var(--aurora2)))",
                  }}
                />
              </div>
              <p className="tnum mt-1.5 text-xs text-muted">{game.totalXp.toLocaleString()} / {game.nextLevelXp.toLocaleString()} XP</p>
            </>
          )}
        </Card>
      </div>

      {/* My Courses — grid on desktop, horizontal scroll on mobile */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">My courses</h2>
          <Link href="/my-learning" className="text-xs font-medium text-brand">See all →</Link>
        </div>
        {enrollments.length === 0 ? (
          <Card>No courses assigned yet. <Link href="/catalog" className="text-brand underline">Find your first course →</Link></Card>
        ) : (
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {enrollments.slice(0, 6).map((e) => (
              <Link key={e.id} href={`/catalog/${e.courseId}`} className="w-64 shrink-0 snap-start sm:w-auto">
                <Card className="flex h-full flex-col transition hover:border-brand/50">
                  <div className="flex items-start gap-3">
                    <span className="glyph flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-bg text-lg ring-1 ring-border">
                      {courseGlyph(e.course?.title ?? "")}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium leading-snug">{e.course?.title ?? "Course"}</p>
                  </div>
                  <div className="mt-3 h-[5px] w-full overflow-hidden rounded-full bg-border">
                    <div className={`h-full rounded-full ${e.status === "completed" ? "bg-green" : "bg-brand"}`} style={{ width: `${e.percent}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="tnum text-xs text-muted">{e.percent}%</span>
                    {statusPill(e)}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Achievements + Certificates */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted">Achievements</h2>
            {game && <p className="tnum text-xs text-muted">{game.badgesEarned} of {game.badgesTotal} earned</p>}
          </div>
          {game && game.badges.length ? (
            <div className="mt-3 flex flex-wrap gap-3">
              {game.badges.map((b) => (
                <span
                  key={b.key}
                  title={`${b.name} — ${b.description}`}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-bg text-xl ring-1 ring-border ${b.earned ? "glyph" : "opacity-25 grayscale"}`}
                >
                  {b.icon}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted">Badges unlock as you learn — complete your first course to start.</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted">Latest certificate</h2>
            <Link href="/certifications" className="text-xs font-medium text-brand">View all →</Link>
          </div>
          {certs.length ? (
            <div className="mt-3">
              <p className="font-medium">{certs[0].name}</p>
              <p className="mt-0.5 text-xs text-muted">
                Awarded {new Date(certs[0].issuedAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </p>
              <div className="mt-3 flex gap-2">
                <a
                  href={certs[0].fileUrl ?? "/certifications"}
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white"
                >
                  Download
                </a>
                <Link href="/certifications" className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-bg">
                  Share
                </Link>
              </div>
              {certs.length > 1 && <p className="tnum mt-2 text-xs text-muted">{certs.length} certificates earned total</p>}
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted">Complete a certified course and your certificate lands here.</p>
          )}
        </Card>
      </div>

      {/* Notifications panel */}
      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-medium">Notifications</h2>
          <Link href="/notifications" className="text-xs font-medium text-brand">See all →</Link>
        </div>
        {notifs.length === 0 ? (
          <p className="p-4 text-sm text-muted">You&apos;re all caught up.</p>
        ) : (
          notifs.slice(0, 4).map((n) => (
            <div key={n.id} className="flex items-start gap-3 border-b border-border/60 p-4 last:border-0">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.readAt ? "bg-border" : "bg-brand"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{NOTIF_LABEL[n.kind] ?? n.kind}</span>
                  {typeof n.payload?.message === "string" ? ` — ${n.payload.message}` : typeof n.payload?.threadTitle === "string" ? ` — ${n.payload.threadTitle}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-muted">{ago(n.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Recommendations keep the intelligence story on the page */}
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
