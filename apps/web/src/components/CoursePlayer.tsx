"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPatch, apiPost, getContext, type DemoContext, type EnrollmentRow } from "@/lib/api";

// The course-taking loop: Start enrolls + marks in-progress + opens the real provider content;
// Mark complete sets 100%, which (server-side) levels up the learner's skills and raises
// readiness. This is what connects the catalog to the intelligence layer.
type Status = "not-started" | "enrolled" | "in-progress" | "completed";

export function CoursePlayer({ courseId, launchUrl }: { courseId: string; launchUrl?: string | null }) {
  const [ctx, setCtx] = useState<DemoContext | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("not-started");
  const [percent, setPercent] = useState(0);
  const [busy, setBusy] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getContext()
      .then(async (c) => {
        setCtx(c);
        const list = await apiGet<EnrollmentRow[]>(`/users/${c.userId}/enrollments`, c);
        const e = list.find((x) => x.courseId === courseId);
        if (e) {
          setEnrollmentId(e.id);
          setStatus(e.status as Status);
          setPercent(e.percent ?? 0);
        }
      })
      .catch(() => {});
  }, [courseId]);

  async function ensureEnrolled(c: DemoContext): Promise<string | null> {
    if (enrollmentId) return enrollmentId;
    const e = await apiPost<EnrollmentRow>("/enrollments", c, { userId: c.userId, courseId });
    setEnrollmentId(e.id);
    setStatus(e.status as Status);
    return e.id;
  }

  async function start() {
    if (!ctx) return;
    setBusy(true);
    setError("");
    try {
      const id = await ensureEnrolled(ctx);
      if (id) {
        const e = await apiPatch<EnrollmentRow>(`/enrollments/${id}/progress`, ctx, { percent: Math.max(25, percent) });
        setStatus(e.status as Status);
        setPercent(e.percent ?? 25);
      }
      if (launchUrl) window.open(launchUrl, "_blank", "noopener");
    } catch {
      setError("Couldn't start the course — please try again, or sign in again if the problem persists.");
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    if (!ctx) return;
    setBusy(true);
    setError("");
    try {
      const id = await ensureEnrolled(ctx);
      if (id) {
        await apiPatch<EnrollmentRow>(`/enrollments/${id}/progress`, ctx, { percent: 100 });
        setStatus("completed");
        setPercent(100);
        setJustCompleted(true);
      }
    } catch {
      setError("Couldn't mark the course complete — please try again.");
    } finally {
      setBusy(false);
    }
  }

  const done = status === "completed";

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{done ? "Completed" : status === "in-progress" ? "In progress" : "Not started"}</p>
        <span className="text-xs text-muted">{percent}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
        <div className={`h-full ${done ? "bg-green" : "bg-brand"}`} style={{ width: `${percent}%` }} />
      </div>

      {error && <p className="mt-3 text-xs text-red">{error}</p>}

      {justCompleted && (
        <div className="mt-4 rounded-lg bg-green/10 p-3 text-sm text-green">
          ✓ Course completed — your skills were leveled up.{" "}
          <Link href="/learner" className="underline">See your updated readiness →</Link>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!done && (
          <button onClick={start} disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {busy ? "…" : status === "in-progress" ? "Continue course" : "Start course"}
            {launchUrl ? " ↗" : ""}
          </button>
        )}
        {!done && (
          <button onClick={complete} disabled={busy} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-bg disabled:opacity-60">
            Mark complete
          </button>
        )}
        {done && launchUrl && (
          <a href={launchUrl} target="_blank" rel="noopener" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-bg">
            Revisit content ↗
          </a>
        )}
      </div>
      {launchUrl && !done && (
        <p className="mt-3 text-xs text-muted">Start opens the real course content in a new tab. Completing it raises your workforce readiness.</p>
      )}
    </div>
  );
}
