import Link from "next/link";
import { Card } from "@/components/ui";
import { ModerateButton, ReplyBox, VoteButton } from "@/components/forum";
import { Avatar } from "@/components/Avatar";
import { apiGet, getContext } from "@/lib/api";

// A forum thread with replies, voting, and instructor moderation (pin / accept answer).
export const dynamic = "force-dynamic";

interface ThreadDetail {
  id: string; courseId: string; courseTitle: string; title: string; body: string; pinned: boolean;
  upvotes: number; author: string; isInstructor: boolean; createdAt: string;
  replies: { id: string; body: string; upvotes: number; accepted: boolean; author: string; isInstructor: boolean; mine: boolean; createdAt: string }[];
}

export default async function ThreadPage({ params }: { params: Promise<{ id: string; threadId: string }> }) {
  const { id, threadId } = await params;
  const ctx = await getContext();
  const t = await apiGet<ThreadDetail>(`/forums/threads/${threadId}`, ctx).catch(() => null);
  if (!t) return <Card>Thread not found. <Link href={`/catalog/${id}/forum`} className="text-brand underline">Back to the forum</Link></Card>;

  const canModerate = (ctx.roles ?? []).some((r) => ["instructor", "trainer", "org_admin", "super_admin"].includes(r));
  const accepted = t.replies.find((r) => r.accepted);
  const rest = t.replies.filter((r) => !r.accepted);

  return (
    <div className="space-y-6">
      <Link href={`/catalog/${id}/forum`} className="text-sm text-muted hover:text-fg">‹ {t.courseTitle} · Forum</Link>

      <Card className={t.pinned ? "border-brand/40" : ""}>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Avatar name={t.author} size={24} />
          <span className="font-medium text-fg">{t.author}</span>
          {t.isInstructor && <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-medium text-brand">Instructor</span>}
          {t.pinned && <span className="text-brand">· Pinned</span>}
        </div>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{t.body}</p>
        <div className="mt-4 flex items-center gap-3">
          <VoteButton ctx={ctx} threadId={t.id} count={t.upvotes} />
          {canModerate && !t.pinned && <ModerateButton ctx={ctx} action="pin" threadId={t.id} label="Pin thread" />}
        </div>
      </Card>

      {accepted && (
        <Card className="border-green/40">
          <p className="text-[10px] font-medium uppercase tracking-wide text-green">✓ Top answer</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted">
            <span className="font-medium text-fg">{accepted.author}</span>
            {accepted.isInstructor && <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-medium text-brand">Instructor</span>}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{accepted.body}</p>
          <div className="mt-3"><VoteButton ctx={ctx} replyId={accepted.id} count={accepted.upvotes} /></div>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted">{t.replies.length} repl{t.replies.length === 1 ? "y" : "ies"}</h2>
        {rest.map((r) => (
          <Card key={r.id}>
            <div className="flex items-center gap-2 text-xs text-muted">
              <Avatar name={r.author} size={22} />
              <span className="font-medium text-fg">{r.author}{r.mine ? " (you)" : ""}</span>
              {r.isInstructor && <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-medium text-brand">Instructor</span>}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{r.body}</p>
            <div className="mt-3 flex items-center gap-3">
              <VoteButton ctx={ctx} replyId={r.id} count={r.upvotes} />
              {canModerate && !accepted && <ModerateButton ctx={ctx} action="accept" threadId={t.id} replyId={r.id} label="Mark as answer" />}
            </div>
          </Card>
        ))}
        <ReplyBox ctx={ctx} threadId={t.id} />
      </section>
    </div>
  );
}
