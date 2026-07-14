"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, type DemoContext } from "@/lib/api";

export interface ModuleRow {
  id: string; position: number; title: string; summary?: string | null;
  durationMinutes?: number | null; content?: string | null; completed: boolean; locked: boolean;
}

/** Module list with sequential unlock (wireframe "Course Detail"): completed ✓, current ▶,
 *  locked —. Completing the current module unlocks the next and advances course progress. */
export function ModuleList({ ctx, modules }: { ctx: DemoContext; modules: ModuleRow[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function complete(moduleId: string) {
    setBusy(true);
    try {
      await apiPost(`/modules/${moduleId}/complete`, ctx);
      setOpenId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const current = modules.find((m) => !m.completed && !m.locked);

  return (
    <div className="divide-y divide-border/60">
      {modules.map((m) => {
        const isCurrent = m.id === current?.id;
        const open = openId === m.id;
        return (
          <div key={m.id} className={`py-3 ${m.locked ? "opacity-50" : ""}`}>
            <button
              disabled={m.locked}
              onClick={() => setOpenId(open ? null : m.id)}
              className="flex w-full items-center gap-3 text-left"
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                m.completed ? "bg-green/20 text-green" : isCurrent ? "bg-brand/20 text-brand" : "bg-border/50 text-muted"
              }`}>
                {m.completed ? "✓" : m.locked ? "—" : m.position}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{m.position}. {m.title}</span>
                <span className="block text-xs text-muted">
                  {m.completed ? "Completed" : m.locked ? "Locked" : isCurrent ? "Up next" : "Unlocked"}
                  {m.durationMinutes ? ` · ${m.durationMinutes} min` : ""}
                </span>
              </span>
              {!m.locked && <span className="text-xs text-muted">{open ? "▾" : "▸"}</span>}
            </button>
            {open && !m.locked && (
              <div className="ml-9 mt-2 space-y-3">
                {m.summary && <p className="text-xs text-muted">{m.summary}</p>}
                {m.content && <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>}
                {!m.completed && (
                  <button
                    onClick={() => complete(m.id)}
                    disabled={busy}
                    className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {busy ? "Saving…" : "Mark module complete ✓"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
