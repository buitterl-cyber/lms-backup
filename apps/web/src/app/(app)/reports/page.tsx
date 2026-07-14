"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { getContext } from "@/lib/api";

// Reporting — authenticated CSV exports for the 6 report kinds. A plain <a download> can't send
// the Authorization header, so we fetch with auth, build a Blob, and trigger the download.
const REPORTS: { kind: string; label: string; desc: string }[] = [
  { kind: "learning", label: "Learning", desc: "Enrollments, status and completion across the org" },
  { kind: "compliance", label: "Compliance", desc: "Control status by person and framework" },
  { kind: "skills", label: "Skills", desc: "Skill profiles, levels and evidence source" },
  { kind: "certification", label: "Certifications", desc: "Expiry status and CPD per holder" },
  { kind: "revenue", label: "Revenue", desc: "Orders and totals" },
  { kind: "readiness", label: "Workforce Readiness", desc: "Per-person role + skill counts" },
];

function tokenFromCookie(): string | null {
  const m = typeof document !== "undefined" ? document.cookie.match(/(?:^|; )riyada_token=([^;]+)/) : null;
  return m ? decodeURIComponent(m[1]) : null;
}

export default function ReportsPage() {
  const [busy, setBusy] = useState<string | null>(null);

  async function download(kind: string) {
    setBusy(kind);
    try {
      const ctx = await getContext();
      const token = tokenFromCookie();
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : { "X-Tenant-Id": ctx.tenantId, "X-Org-Id": ctx.organizationId, "X-User-Id": ctx.userId, "X-Roles": "org_admin" };
      const res = await fetch(`/api/v1/reports/${kind}?format=csv`, { headers });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted">Export workforce, compliance and learning data. CSV now; PDF/Excel/PowerBI on the roadmap.</p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Card key={r.kind} className="flex flex-col">
            <p className="font-medium">{r.label}</p>
            <p className="mt-1 flex-1 text-xs text-muted">{r.desc}</p>
            <button onClick={() => download(r.kind)} disabled={busy === r.kind} className="mt-4 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-bg disabled:opacity-60">
              {busy === r.kind ? "Preparing…" : "Download CSV"}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
