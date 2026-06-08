"use client";

import { useState } from "react";
import { apiPost, getContext } from "@/lib/api";

// Real enroll action: resolves the demo context, then POSTs an enrollment. Clicking does
// something (the whole point) — and reflects state.
export function EnrollButton({ courseId, label = "Enroll", className = "" }: { courseId: string; label?: string; className?: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function enroll() {
    setState("loading");
    try {
      const ctx = await getContext();
      await apiPost("/enrollments", ctx, { userId: ctx.userId, courseId });
      setState("done");
    } catch {
      setState("error");
    }
  }

  const styles =
    state === "done"
      ? "bg-green/15 text-green border border-green/30"
      : state === "error"
        ? "bg-red/15 text-red border border-red/30"
        : "bg-brand text-white";

  return (
    <button
      onClick={enroll}
      disabled={state === "loading" || state === "done"}
      className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-80 ${styles} ${className}`}
    >
      {state === "done" ? "Enrolled ✓" : state === "loading" ? "Enrolling…" : state === "error" ? "Retry" : label}
    </button>
  );
}
