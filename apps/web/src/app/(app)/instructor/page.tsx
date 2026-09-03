import { Card, EmptyState, MetricCard, Table, Td, Th, Thead } from "@/components/ui";
import { CourseBuilder, ReviewAction } from "@/components/InstructorTools";
import { isAdmin, apiGet, getContext } from "@/lib/api";
import { AccessDenied } from "@/components/AccessDenied";

// Instructor Portal (wireframe "Instructor View"): KPIs, course performance, peer-review
// queue, recent feedback — plus the native Course Builder (modules w/ sequential unlock).
export const dynamic = "force-dynamic";

interface Overview {
  totalLearners: number;
  avgRating: number | null;
  unansweredPosts: number;
  performance: { courseId: string; title: string; enrolled: number; completion: number; avgScore: number | null; rating: number | null; forumPosts: number }[];
  recentFeedback: { comment: string | null; rating: number; course: string; anonymous: boolean }[];
}
interface QueueItem { id: string; title: string; content: string; submitter: string; course: string | null; createdAt: string }

export default async function InstructorPage() {
  const ctx = await getContext();
  if (!isAdmin(ctx.roles)) return <AccessDenied />;
  const [overview, queue] = await Promise.all([
    apiGet<Overview>("/instructor/overview", ctx).catch(() => null),
    apiGet<QueueItem[]>("/peer-reviews?status=pending", ctx).catch(() => [] as QueueItem[]),
  ]);
  if (!overview) return <Card><EmptyState icon="alert" title="Could not load the instructor overview" description="Try refreshing — if this keeps happening, check the API connection." /></Card>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Instructor Overview</h1>
        <p className="text-sm text-muted">Your courses, learners, and what needs attention.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Total learners" value={`${overview.totalLearners}`} />
        <MetricCard label="Avg course rating" value={overview.avgRating ? `${overview.avgRating}` : "—"} sub="across rated courses" />
        <Card>
          <p className="text-sm text-muted">Unanswered posts</p>
          <p className={`mt-1 text-3xl font-semibold ${overview.unansweredPosts > 0 ? "text-amber" : ""}`}>{overview.unansweredPosts}</p>
          {overview.unansweredPosts > 0 && <p className="mt-1 text-xs text-amber">Needs attention</p>}
        </Card>
      </div>

      <Card padding="none">
        <div className="border-b border-border p-4 text-sm font-medium">Course performance</div>
        {overview.performance.length === 0 ? (
          <EmptyState
            icon="course"
            title="No courses yet"
            description="Course performance shows up here once you've published a course and learners start enrolling."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[560px]">
              <Thead>
                <tr className="border-b border-border">
                  <Th>Course</Th><Th>Enrolled</Th><Th>Completion</Th>
                  <Th>Avg score</Th><Th>Rating</Th><Th>Forum</Th>
                </tr>
              </Thead>
              <tbody>
                {overview.performance.map((c) => (
                  <tr key={c.courseId} className="border-b border-border/60 last:border-0">
                    <Td className="max-w-[220px] truncate font-medium">{c.title}</Td>
                    <Td>{c.enrolled}</Td>
                    <Td>{c.completion}%</Td>
                    <Td>{c.avgScore ?? "—"}</Td>
                    <Td>{c.rating ?? "—"}</Td>
                    <Td>{c.forumPosts} posts</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-medium text-muted">Peer review queue <span className="font-normal">· {queue.length} pending</span></h2>
          <div className="mt-3 space-y-3">
            {queue.length === 0 && <p className="text-xs text-muted">Nothing waiting for review.</p>}
            {queue.map((q) => (
              <Card key={q.id} tone="none" radius="lg" padding="sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{q.submitter} → {q.title}</p>
                    {q.course && <p className="text-xs text-muted">{q.course}</p>}
                  </div>
                  <ReviewAction ctx={ctx} id={q.id} />
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted">{q.content}</p>
              </Card>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-medium text-muted">Recent feedback</h2>
          <div className="mt-3 space-y-3">
            {overview.recentFeedback.length === 0 && <p className="text-xs text-muted">No written feedback yet.</p>}
            {overview.recentFeedback.map((f, i) => (
              <blockquote key={i} className="border-s-2 border-border ps-3">
                <p className="text-sm italic leading-relaxed">&ldquo;{f.comment}&rdquo;</p>
                <p className="mt-1 text-xs text-muted">{f.anonymous ? "Anonymous" : "Learner"} · {f.course} · {"★".repeat(f.rating)}</p>
              </blockquote>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-medium">Course Builder</h2>
        <p className="mt-1 text-xs text-muted">Author a native course with ordered modules — learners unlock them sequentially.</p>
        <div className="mt-4"><CourseBuilder ctx={ctx} /></div>
      </Card>
    </div>
  );
}
