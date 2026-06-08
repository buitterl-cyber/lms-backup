import Link from "next/link";
import { Card, RiskBadge } from "@/components/ui";
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
          <h1 className="text-2xl font-semibold tracking-tight">My Learning</h1>
          <p className="text-sm text-muted">{rows.length} enrolled · {done} completed</p>
        </div>
        <Link href="/catalog" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-card">Browse catalog</Link>
      </header>

      {rows.length === 0 ? (
        <Card>
          You haven&apos;t enrolled in anything yet. <Link href="/catalog" className="text-brand underline">Find a course →</Link>
        </Card>
      ) : (
        <Card className="p-0">
          {rows.map((r) => (
            <Link key={r.id} href={`/catalog/${r.courseId}`} className="flex items-center gap-4 border-b border-border/60 p-4 last:border-0 hover:bg-bg">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.course?.title ?? "Course"}</p>
                <p className="text-xs uppercase tracking-wide text-muted">{PROVIDER_LABEL[r.course?.providerKey ?? ""] ?? r.course?.providerKey}</p>
              </div>
              <div className="w-32">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div className={`h-full ${r.status === "completed" ? "bg-green" : "bg-brand"}`} style={{ width: `${r.percent}%` }} />
                </div>
              </div>
              <RiskBadge
                risk={r.status === "completed" ? "green" : r.status === "in-progress" ? "amber" : "red"}
                label={r.status === "completed" ? "Completed" : r.status === "in-progress" ? "In progress" : "Enrolled"}
              />
              <span className="text-sm font-medium text-brand">{r.status === "completed" ? "Revisit" : "Continue"} →</span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
