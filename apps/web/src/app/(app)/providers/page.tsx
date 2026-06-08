"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { apiGet, apiPost, getContext, type DemoContext, type ProviderConn } from "@/lib/api";

// Admin → Providers: connect learning providers and sync their catalogs into the aggregation hub.
// Microsoft Learn pulls real content; the others are registered connectors (live OAuth pending).
const LABEL: Record<string, string> = {
  go1: "GO1", "ms-learn": "Microsoft Learn", "aws-skill-builder": "AWS Skill Builder",
  "open-sesame": "OpenSesame", "internal:confluence": "Confluence", "internal:sharepoint": "SharePoint",
  "internal:google-drive": "Google Drive", "internal:m365": "Microsoft 365", "internal:notion": "Notion",
};
const REAL = new Set(["ms-learn"]);

export default function ProvidersAdminPage() {
  const [ctx, setCtx] = useState<DemoContext | null>(null);
  const [available, setAvailable] = useState<string[]>([]);
  const [conns, setConns] = useState<ProviderConn[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function refresh(c: DemoContext) {
    setAvailable(await apiGet<string[]>("/providers/available", c));
    setConns(await apiGet<ProviderConn[]>("/providers/connections", c));
  }
  useEffect(() => {
    getContext().then((c) => { setCtx(c); return refresh(c); }).catch(() => {});
  }, []);

  async function connect(providerKey: string) {
    if (!ctx) return;
    await apiPost("/providers/connections", ctx, { providerKey, displayName: LABEL[providerKey] ?? providerKey, credentials: {} });
    await refresh(ctx);
  }
  async function sync(id: string) {
    if (!ctx) return;
    setSyncing(id);
    setMsg("");
    try {
      const r = await apiPost<{ coursesUpserted?: number; skillsCreated?: number }>(`/providers/connections/${id}/sync`, ctx);
      setMsg(`Synced ${r.coursesUpserted ?? 0} courses, ${r.skillsCreated ?? 0} new skills.`);
      await refresh(ctx);
    } catch {
      setMsg("Sync failed.");
    } finally {
      setSyncing(null);
    }
  }

  const connected = new Set(conns.map((c) => c.providerKey));
  const connectable = available.filter((k) => !connected.has(k));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Providers</h1>
        <p className="text-sm text-muted">Connect learning providers and sync their catalogs into one hub.</p>
      </header>

      {msg && <Card className="text-sm text-green">{msg}</Card>}

      <Card className="p-0">
        <div className="border-b border-border p-4 text-sm font-medium">Connected ({conns.length})</div>
        {conns.length === 0 ? (
          <p className="p-4 text-sm text-muted">No providers connected yet — connect one below.</p>
        ) : (
          conns.map((c) => (
            <div key={c.id} className="flex items-center gap-4 border-b border-border/60 p-4 last:border-0">
              <div className="flex-1">
                <p className="font-medium">{LABEL[c.providerKey] ?? c.displayName}</p>
                <p className="text-xs text-muted">
                  {c.courses} courses{c.lastSyncedAt ? ` · last synced ${new Date(c.lastSyncedAt).toLocaleString()}` : " · never synced"}
                  {REAL.has(c.providerKey) ? "" : " · live OAuth pending"}
                </p>
              </div>
              <button onClick={() => sync(c.id)} disabled={syncing === c.id} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                {syncing === c.id ? "Syncing…" : "Sync catalog"}
              </button>
            </div>
          ))
        )}
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted">Available to connect</h2>
        <div className="flex flex-wrap gap-2">
          {connectable.map((k) => (
            <button key={k} onClick={() => connect(k)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:border-brand hover:text-fg">
              + {LABEL[k] ?? k}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
