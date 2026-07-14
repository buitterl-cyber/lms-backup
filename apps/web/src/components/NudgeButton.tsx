"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, type DemoContext } from "@/lib/api";

/** Manager "Nudge" action (wireframe): sends the learner an in-app + email reminder. */
export function NudgeButton({
  learnerId,
  courseId,
  ctx,
  label = "Nudge",
  className = "",
}: {
  learnerId: string;
  courseId?: string | null;
  ctx: DemoContext;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function nudge() {
    setState("busy");
    try {
      await apiPost("/workforce/nudge", ctx, { learnerId, courseId: courseId ?? undefined });
      setState("done");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  if (state === "done")
    return <span className={`text-xs font-medium text-green ${className}`}>Nudged ✓</span>;
  return (
    <button
      onClick={nudge}
      disabled={state === "busy"}
      className={`rounded-lg border border-brand/40 px-3 py-1 text-xs font-medium text-brand hover:bg-brand/10 disabled:opacity-50 ${className}`}
    >
      {state === "busy" ? "Sending…" : state === "error" ? "Retry nudge" : label}
    </button>
  );
}
