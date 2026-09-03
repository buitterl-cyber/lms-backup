import Link from "next/link";
import { Button, Card, Chevron, courseGlyph, EmptyState, RiskBadge } from "@/components/ui";
import { apiGet, getContext, type EnrollmentRow } from "@/lib/api";

// My Learning — the learner's enrolled courses with live progress. Continue opens the course;
// completing it (on the course page) levels up skills.
export const dynamic = "force-dynamic";

const PROVIDER_LABEL: Record<string, string> = {
  go1: "GO1", "ms-learn": "Microsoft Learn", aws: "AWS Skill Builder", cybrary: "Cybrary",
  oreilly: "O'Reilly", "open-sesame": "OpenSesame", "ai-generated": "AI Generated",
};

async function load() {
  try {
    const ctx = await getContext();
    return await apiGet<EnrollmentRow[]>(`/users/${ctx.userId}/enrollments`, ctx);
  } catch {
    return [];
  }
}

export default async function MyLearningPage() {
  const rows = await load();
  const done = rows.filter((r) => r.status === "completed").length;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold sm:text-2xl">My Learning</h1>
          <p className="text-sm text-muted">{rows.length} enrolled · {done} completed</p>
        </div>
        <Button href="/catalog" variant="secondary">Browse catalog</Button>
      </header>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon="course"
            title="Nothing enrolled yet"
            description="Find your first course in the catalog and it'll show up here."
            action={<Button href="/catalog" size="sm">Browse the catalog</Button>}
          />
        </Card>
      ) : (
        <Card padding="none">
          {rows.map((r) => (
            <Link key={r.id} href={`/catalog/${r.courseId}`} className="flex items-center gap-4 border-b border-border/60 p-4 last:border-0 hover:bg-bg">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg text-lg ring-1 ring-border">{courseGlyph(r.course?.title ?? "")}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.course?.title ?? "Course"}</p>
                <p className="text-xs uppercase tracking-wide text-muted">{PROVIDER_LABEL[r.course?.providerKey ?? ""] ?? r.course?.providerKey}</p>
              </div>
              {r.dueAt && r.status !== "completed" && (() => {
                const days = Math.ceil((new Date(r.dueAt).getTime() - Date.now()) / 86_400_000);
                return (
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${days < 0 ? "bg-red/15 text-red" : days <= 5 ? "bg-amber/15 text-amber" : "bg-border/60 text-muted"}`}>
                    {days < 0 ? `Overdue ${-days}d` : `Due in ${days}d`}
                  </span>
                );
              })()}
              <div className="w-32">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div className={`h-full ${r.status === "completed" ? "bg-green" : "bg-brand"}`} style={{ width: `${r.percent}%` }} />
                </div>
              </div>
              <RiskBadge
                risk={r.status === "completed" ? "green" : r.status === "in-progress" ? "amber" : "red"}
                label={r.status === "completed" ? "Completed" : r.status === "in-progress" ? "In progress" : "Enrolled"}
              />
              <span className="inline-flex items-center gap-1 text-sm font-medium text-brand">{r.status === "completed" ? "Revisit" : "Continue"} <Chevron /></span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
