"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, type DemoContext } from "@/lib/api";
import { Button, Card } from "@/components/ui";

/** Client interactivity for the course forum: compose, reply, vote, pin, accept. */

export function VoteButton({ ctx, threadId, replyId, count }: { ctx: DemoContext; threadId?: string; replyId?: string; count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [voted, setVoted] = useState(false);
  async function vote() {
    if (voted) return;
    setBusy(true);
    try {
      const path = threadId ? `/forums/threads/${threadId}/vote` : `/forums/replies/${replyId}/vote`;
      await apiPost<{ voted: boolean }>(path, ctx);
      setVoted(true);
      router.refresh();
    } catch {
      /* keep count as-is */
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      onClick={vote}
      disabled={busy || voted}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ${voted ? "bg-brand/15 text-brand" : "text-muted hover:text-brand"}`}
    >
      ↑ {count + (voted ? 1 : 0)}{threadId ? " helpful" : ""}
    </button>
  );
}

export function NewThreadForm({ ctx, courseId }: { ctx: DemoContext; courseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    try {
      await apiPost(`/forums/${courseId}/threads`, ctx, { title, body, anonymous });
      setTitle(""); setBody(""); setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!open)
    return <Button onClick={() => setOpen(true)}>+ New Post</Button>;
  return (
    <Card padding="md" className="w-full">
      <input
        value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title — what's your question?"
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <textarea
        value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Add details…"
        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <div className="mt-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          Post anonymously
        </label>
        <div className="flex gap-2">
          <Button onClick={() => setOpen(false)} variant="secondary" size="sm" className="hover:bg-bg!">Cancel</Button>
          <Button onClick={submit} disabled={busy} size="sm">
            {busy ? "Posting…" : "Post"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function ReplyBox({ ctx, threadId }: { ctx: DemoContext; threadId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!body.trim()) return;
    setBusy(true);
    try {
      await apiPost(`/forums/threads/${threadId}/replies`, ctx, { body, anonymous });
      setBody("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card padding="md">
      <textarea
        value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Write a reply…"
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <div className="mt-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          Reply anonymously
        </label>
        <Button onClick={submit} disabled={busy} size="sm">
          {busy ? "Sending…" : "Reply"}
        </Button>
      </div>
    </Card>
  );
}

/** Instructor-only moderation: pin a thread / accept a reply as the answer. */
export function ModerateButton({ ctx, action, threadId, replyId, label }: {
  ctx: DemoContext; action: "pin" | "accept"; threadId: string; replyId?: string; label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const path = action === "pin" ? `/forums/threads/${threadId}/pin` : `/forums/threads/${threadId}/accept/${replyId}`;
      await apiPost(path, ctx, action === "pin" ? { pinned: true } : undefined);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <button onClick={run} disabled={busy} className="text-[11px] text-muted underline-offset-2 hover:text-brand hover:underline">
      {label}
    </button>
  );
}
