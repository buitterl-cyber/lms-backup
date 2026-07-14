"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, type DemoContext } from "@/lib/api";

/** 1..5 star rating + optional comment; feeds manager Course Ratings + instructor feedback. */
export function RateCourse({ ctx, courseId }: { ctx: DemoContext; courseId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  async function submit(r: number) {
    setRating(r);
    setState("busy");
    try {
      await apiPost(`/courses/${courseId}/review`, ctx, { rating: r, comment: comment || undefined });
      setState("done");
      router.refresh();
    } catch {
      setState("idle");
    }
  }

  if (state === "done") return <p className="text-xs text-green">Thanks — your rating is in ✓</p>;
  return (
    <div>
      <div className="flex gap-1 text-xl">
        {[1, 2, 3, 4, 5].map((r) => (
          <button key={r} onClick={() => submit(r)} disabled={state === "busy"} className={r <= rating ? "text-amber" : "text-border hover:text-amber"}>
            ★
          </button>
        ))}
      </div>
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional feedback for the instructor…"
        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-xs outline-none focus:border-brand"
      />
    </div>
  );
}
