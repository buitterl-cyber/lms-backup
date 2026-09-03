"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, type DemoContext } from "@/lib/api";
import { Button, Chevron } from "@/components/ui";

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
    <Button onClick={nudge} disabled={state === "busy"} variant="outline" size="sm" className={className}>
      {state === "busy" ? "Sending…" : state === "error" ? "Retry nudge" : <>{label} <Chevron className="ms-1" /></>}
    </Button>
  );
}
