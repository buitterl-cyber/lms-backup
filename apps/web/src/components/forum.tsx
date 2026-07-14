"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, type DemoContext } from "@/lib/api";

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
    return (
      <button onClick={() => setOpen(true)} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
        + New Post
      </button>
    );
  return (
    <div className="w-full rounded-xl border border-border bg-card p-4">
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
          <button onClick={() => setOpen(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs">Cancel</button>
          <button onClick={submit} disabled={busy} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
            {busy ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
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
    <div className="rounded-xl border border-border bg-card p-4">
      <textarea
        value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Write a reply…"
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <div className="mt-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          Reply anonymously
        </label>
        <button onClick={submit} disabled={busy} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
          {busy ? "Sending…" : "Reply"}
        </button>
      </div>
    </div>
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
