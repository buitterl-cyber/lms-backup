"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPatch, type DemoContext } from "@/lib/api";

const STATUSES = ["new", "contacted", "qualified", "won", "lost"];

export function PipelineStatus({ ctx, id, status }: { ctx: DemoContext; id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function change(next: string) {
    setBusy(true);
    try {
      await apiPatch(`/sales/pipeline/${id}`, ctx, { status: next });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <select
      value={status}
      disabled={busy}
      onChange={(e) => change(e.target.value)}
      className="rounded-lg border border-border bg-bg px-2 py-1 text-xs outline-none focus:border-brand"
    >
      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
