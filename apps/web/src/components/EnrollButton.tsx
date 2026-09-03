"use client";

import { useState } from "react";
import { apiPost, getContext } from "@/lib/api";
import { Button, type ButtonVariant } from "@/components/ui";

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

  const variant: ButtonVariant = state === "done" ? "success" : state === "error" ? "danger" : "primary";

  return (
    <Button
      onClick={enroll}
      disabled={state === "loading" || state === "done"}
      variant={variant}
      className={`disabled:opacity-80! ${className}`}
    >
      {state === "done" ? "Enrolled ✓" : state === "loading" ? "Enrolling…" : state === "error" ? "Retry" : label}
    </Button>
  );
}
