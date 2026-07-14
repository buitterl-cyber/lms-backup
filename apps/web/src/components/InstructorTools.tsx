"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, type DemoContext } from "@/lib/api";

/** Course builder: create a native course, then add ordered modules to it. */
export function CourseBuilder({ ctx }: { ctx: DemoContext }) {
  const router = useRouter();
  const [course, setCourse] = useState<{ id: string; title: string } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [modTitle, setModTitle] = useState("");
  const [modContent, setModContent] = useState("");
  const [modMinutes, setModMinutes] = useState("");
  const [modules, setModules] = useState<string[]>([]);

  async function createCourse() {
    if (!title.trim() || !description.trim()) return;
    setBusy(true);
    try {
      const c = await apiPost<{ id: string; title: string }>("/instructor/courses", ctx, { title, description });
      setCourse(c);
    } finally {
      setBusy(false);
    }
  }

  async function addModule() {
    if (!course || !modTitle.trim()) return;
    setBusy(true);
    try {
      await apiPost(`/instructor/courses/${course.id}/modules`, ctx, {
        title: modTitle,
        content: modContent || undefined,
        durationMinutes: modMinutes ? Number(modMinutes) : undefined,
      });
      setModules((m) => [...m, modTitle]);
      setModTitle(""); setModContent(""); setModMinutes("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!course) {
    return (
      <div className="space-y-2">
        <input
          value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course title"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What will learners get out of it?"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button onClick={createCourse} disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {busy ? "Creating…" : "Create course"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm">
        <span className="rounded bg-green/15 px-1.5 py-0.5 text-xs font-medium text-green">Created</span>{" "}
        <span className="font-medium">{course.title}</span>
      </p>
      {modules.length > 0 && (
        <ol className="list-inside list-decimal space-y-1 text-sm text-muted">
          {modules.map((m, i) => <li key={i}>{m}</li>)}
        </ol>
      )}
      <div className="space-y-2 rounded-lg border border-border p-3">
        <p className="text-xs font-medium text-muted">Add module {modules.length + 1}</p>
        <input
          value={modTitle} onChange={(e) => setModTitle(e.target.value)} placeholder="Module title"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <textarea
          value={modContent} onChange={(e) => setModContent(e.target.value)} rows={3} placeholder="Lesson content (markdown/text)"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <div className="flex items-center gap-2">
          <input
            value={modMinutes} onChange={(e) => setModMinutes(e.target.value)} placeholder="Minutes" inputMode="numeric"
            className="w-24 rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <button onClick={addModule} disabled={busy} className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
            {busy ? "Adding…" : "Add module"}
          </button>
        </div>
      </div>
      <button onClick={() => { setCourse(null); setModules([]); setTitle(""); setDescription(""); }} className="text-xs text-muted underline">
        Start another course
      </button>
    </div>
  );
}

/** Grade an item in the peer-review queue. */
export function ReviewAction({ ctx, id }: { ctx: DemoContext; id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!feedback.trim()) return;
    setBusy(true);
    try {
      await apiPost(`/peer-reviews/${id}/review`, ctx, { feedback, score: score ? Number(score) : undefined });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!open)
    return <button onClick={() => setOpen(true)} className="rounded-lg border border-brand/40 px-3 py-1 text-xs font-medium text-brand hover:bg-brand/10">Review</button>;
  return (
    <div className="mt-2 w-full space-y-2">
      <textarea
        value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={2} placeholder="Feedback for the learner…"
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs outline-none focus:border-brand"
      />
      <div className="flex items-center gap-2">
        <input
          value={score} onChange={(e) => setScore(e.target.value)} placeholder="Score /100" inputMode="numeric"
          className="w-24 rounded-lg border border-border bg-bg px-3 py-1.5 text-xs outline-none focus:border-brand"
        />
        <button onClick={submit} disabled={busy} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
          {busy ? "Saving…" : "Submit review"}
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-muted">Cancel</button>
      </div>
    </div>
  );
}
