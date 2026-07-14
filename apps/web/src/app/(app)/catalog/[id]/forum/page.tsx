import Link from "next/link";
import { Card } from "@/components/ui";
import { NewThreadForm, VoteButton } from "@/components/forum";
import { StudyAssistant } from "@/components/StudyAssistant";
import { Avatar } from "@/components/Avatar";
import { apiGet, getContext, type CourseDetail } from "@/lib/api";

// Course Forum (wireframe): discussions with pinned/instructor/anonymous posts, upvotes,
// filters, forum stats, and the course-grounded AI Study Assistant.
export const dynamic = "force-dynamic";

interface ThreadRow {
  id: string; title: string; body: string; pinned: boolean; answered: boolean; upvotes: number;
  replies: number; author: string; isInstructor: boolean; mine: boolean; createdAt: string;
}
interface ForumStats { totalPosts: number; answered: number; answeredPct: number; myPosts: number; enrolled: number }

const FILTERS = [
  { key: "all", label: "All Discussions" },
  { key: "pinned", label: "Pinned" },
  { key: "mine", label: "My Posts" },
  { key: "unanswered", label: "Unanswered" },
];

function ago(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default async function ForumPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { id } = await params;
  const { filter = "all" } = await searchParams;
  const ctx = await getContext();
  const [course, threads, stats] = await Promise.all([
    apiGet<CourseDetail>(`/catalog/courses/${id}`, ctx).catch(() => null),
    apiGet<ThreadRow[]>(`/forums/${id}/threads?filter=${filter}`, ctx).catch(() => [] as ThreadRow[]),
    apiGet<ForumStats>(`/forums/${id}/stats`, ctx).catch(() => null),
  ]);
  if (!course) return <Card>Course not found.</Card>;

  return (
    <div className="space-y-6">
      <Link href={`/catalog/${id}`} className="text-sm text-muted hover:text-fg">‹ {course.title}</Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{course.title} · Forum</h1>
          <p className="text-sm text-muted">{stats?.enrolled ?? 0} learners enrolled</p>
        </div>
        <NewThreadForm ctx={ctx} courseId={id} />
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/catalog/${id}/forum?filter=${f.key}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${filter === f.key ? "bg-brand text-white" : "border border-border text-muted hover:text-fg"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {threads.length === 0 && <Card>No discussions {filter !== "all" ? "matching this filter" : "yet — start the first one"}.</Card>}
          {threads.map((t) => (
            <Card key={t.id} className={t.pinned ? "border-brand/40" : ""}>
              {t.pinned && <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-brand">— Pinned by instructor</p>}
              <div className="flex items-center gap-2 text-xs text-muted">
                <Avatar name={t.author} size={22} />
                <span className="font-medium text-fg">{t.author}</span>
                {t.isInstructor && <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-medium text-brand">Instructor</span>}
                <span>· {ago(t.createdAt)}</span>
                {t.answered && <span className="rounded bg-green/15 px-1.5 py-0.5 text-[10px] font-medium text-green">Answered</span>}
              </div>
              <Link href={`/catalog/${id}/forum/${t.id}`} className="mt-1 block font-medium hover:text-brand">{t.title}</Link>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{t.body}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                <VoteButton ctx={ctx} threadId={t.id} count={t.upvotes} />
                <Link href={`/catalog/${id}/forum/${t.id}`} className="hover:text-fg">{t.replies} repl{t.replies === 1 ? "y" : "ies"}</Link>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <StudyAssistant ctx={ctx} courseId={id} courseTitle={course.title} />
          {stats && (
            <Card>
              <h2 className="text-sm font-medium text-muted">Forum stats</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Total posts</dt><dd className="font-medium">{stats.totalPosts}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Answered</dt><dd className="font-medium">{stats.answered} ({stats.answeredPct}%)</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Your posts</dt><dd className="font-medium">{stats.myPosts}</dd></div>
              </dl>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
