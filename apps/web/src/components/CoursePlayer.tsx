"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPatch, apiPost, getContext, type DemoContext, type EnrollmentRow } from "@/lib/api";
import { Button, Card, Chevron } from "@/components/ui";

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
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{done ? "Completed" : status === "in-progress" ? "In progress" : "Not started"}</p>
        <span className="text-xs text-muted">{percent}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
        <div className={`h-full ${done ? "bg-green" : "bg-brand"}`} style={{ width: `${percent}%` }} />
      </div>

      {error && <p className="mt-3 text-xs text-red">{error}</p>}

      {justCompleted && (
        <Card tone="green" radius="lg" padding="sm" className="mt-4 text-sm text-green">
          ✓ Course completed — your skills were leveled up.{" "}
          <Link href="/learner" className="inline-flex items-center gap-1 underline">See your updated readiness <Chevron /></Link>
        </Card>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!done && (
          <Button onClick={start} disabled={busy}>
            {busy ? "…" : status === "in-progress" ? "Continue course" : "Start course"}
            {launchUrl ? " ↗" : ""}
          </Button>
        )}
        {!done && (
          <Button onClick={complete} disabled={busy} variant="secondary" className="hover:bg-bg!">
            Mark complete
          </Button>
        )}
        {done && launchUrl && (
          <Button href={launchUrl} target="_blank" rel="noopener" variant="secondary" className="hover:bg-bg!">
            Revisit content ↗
          </Button>
        )}
      </div>
      {launchUrl && !done && (
        <p className="mt-3 text-xs text-muted">Start opens the real course content in a new tab. Completing it raises your workforce readiness.</p>
      )}
    </Card>
  );
}
