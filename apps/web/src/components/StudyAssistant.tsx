"use client";

import { useState } from "react";
import { apiPost, type DemoContext } from "@/lib/api";

/** AI Study Assistant (wireframe): chat grounded in THIS course's content via /ai/chat courseId. */
export function StudyAssistant({ ctx, courseId, courseTitle }: { ctx: DemoContext; courseId: string; courseTitle: string }) {
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask() {
    if (!q.trim() || busy) return;
    setBusy(true);
    setAsked(q);
    setAnswer(null);
    try {
      const res = await apiPost<{ answer: string }>("/ai/chat", ctx, { prompt: q, courseId });
      setAnswer(res.answer || "No answer — try rephrasing.");
    } catch {
      setAnswer("The assistant is unavailable right now.");
    } finally {
      setBusy(false);
      setQ("");
    }
  }

  return (
    <div className="rounded-xl border border-brand/30 bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-medium"><span className="text-brand">◈</span> AI Study Assistant</p>
      <p className="mt-1 text-xs text-muted">Ask anything about {courseTitle} — answers are grounded in the course content.</p>
      {asked && (
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-xs text-muted">You asked: <span className="text-fg">{asked}</span></p>
          {busy ? <p className="animate-pulse text-xs text-muted">Thinking…</p> : <p className="whitespace-pre-wrap leading-relaxed">{answer}</p>}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="e.g. When should I use useMemo vs useCallback?"
          className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button onClick={ask} disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          Ask
        </button>
      </div>
    </div>
  );
}
