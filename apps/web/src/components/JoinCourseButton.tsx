"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, type DemoContext } from "@/lib/api";
import { Button } from "@/components/ui";

/** Manager opt-in: self-enroll in a course their team is taking. Purely optional — this is the
 *  same self-enrollment right every learner has, just surfaced next to "what my team is doing". */
export function JoinCourseButton({ courseId, ctx }: { courseId: string; ctx: DemoContext }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function join() {
    setState("busy");
    try {
      await apiPost("/enrollments", ctx, {
        userId: ctx.userId,
        courseId,
        assignedReason: "Opted in to see what the team is learning",
      });
      setState("done");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  if (state === "done") return <span className="text-xs font-medium text-green">Joined ✓</span>;
  return (
    <Button onClick={join} disabled={state === "busy"} variant="outline" size="sm">
      {state === "busy" ? "Joining…" : state === "error" ? "Retry" : "Join (optional)"}
    </Button>
  );
}
