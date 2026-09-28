"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { isAdmin, apiGet, apiPost, getContext, type DemoContext, type ProviderConn } from "@/lib/api";
import { AccessDenied } from "@/components/AccessDenied";

// Admin → Providers: connect learning providers (incl. a client's own LearnWorlds school) and sync
// their catalogs into the aggregation hub.
const LABEL: Record<string, string> = {
  go1: "GO1", "ms-learn": "Microsoft Learn", "aws-skill-builder": "AWS Skill Builder", learnworlds: "LearnWorlds",
  "open-sesame": "OpenSesame", "internal:confluence": "Confluence", "internal:sharepoint": "SharePoint",
  "internal:google-drive": "Google Drive", "internal:m365": "Microsoft 365", "internal:notion": "Notion",
};
const REAL = new Set(["ms-learn", "go1"]);
// Providers that need credentials before they can connect.
const CRED_FIELDS: Record<string, { name: string; label: string; placeholder: string }[]> = {
  learnworlds: [
    { name: "school", label: "School URL", placeholder: "yourschool.learnworlds.com" },
    { name: "clientId", label: "Client ID", placeholder: "Lw-Client id" },
    { name: "clientSecret", label: "Client secret", placeholder: "••••••••" },
  ],
  // Confirmed live against the sandbox portal (gateway.go1.com, Api-Version 2025-01-01) — OAuth2
  // client-credentials, not a browser redirect flow. See packages/providers go1.provider.ts.
  go1: [
    { name: "clientId", label: "Client ID", placeholder: "GO1 OAuth client id" },
    { name: "clientSecret", label: "Client secret", placeholder: "••••••••" },
  ],
};

export default function ProvidersAdminPage() {
  const [ctx, setCtx] = useState<DemoContext | null>(null);
  const [available, setAvailable] = useState<string[]>([]);
  const [conns, setConns] = useState<ProviderConn[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [connectKey, setConnectKey] = useState<string | null>(null);
  const [creds, setCreds] = useState<Record<string, string>>({});

  async function refresh(c: DemoContext) {
    setAvailable(await apiGet<string[]>("/providers/available", c));
    setConns(await apiGet<ProviderConn[]>("/providers/connections", c));
  }
  useEffect(() => {
    getContext().then((c) => { setCtx(c); return refresh(c); }).catch(() => {});
  }, []);

  function startConnect(providerKey: string) {
    if (CRED_FIELDS[providerKey]) {
      setConnectKey(providerKey);
      setCreds({});
    } else {
      void connect(providerKey, {});
    }
  }
  async function connect(providerKey: string, credentials: Record<string, string>) {
    if (!ctx) return;
    await apiPost("/providers/connections", ctx, { providerKey, displayName: LABEL[providerKey] ?? providerKey, credentials });
    setConnectKey(null);
    setMsg(`Connected ${LABEL[providerKey] ?? providerKey}.`);
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
      setMsg("Sync failed — check the connection's credentials.");
    } finally {
      setSyncing(null);
    }
  }

  const connected = new Set(conns.map((c) => c.providerKey));
  const connectable = available.filter((k) => !connected.has(k));

  if (ctx && !isAdmin(ctx.roles)) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Providers</h1>
        <p className="text-sm text-muted">Connect learning providers — including a client&apos;s own LearnWorlds school — and sync catalogs into one hub.</p>
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
                  {REAL.has(c.providerKey) || CRED_FIELDS[c.providerKey] ? "" : " · live OAuth pending"}
                </p>
              </div>
              <button onClick={() => sync(c.id)} disabled={syncing === c.id} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                {syncing === c.id ? "Syncing…" : "Sync catalog"}
              </button>
            </div>
          ))
        )}
      </Card>

      {connectKey && CRED_FIELDS[connectKey] && (
        <Card>
          <h2 className="text-sm font-medium">Connect {LABEL[connectKey]}</h2>
          <p className="mt-1 text-xs text-muted">Enter the client&apos;s {LABEL[connectKey]} API credentials.</p>
          <div className="mt-3 space-y-2">
            {CRED_FIELDS[connectKey].map((f) => (
              <div key={f.name}>
                <label className="text-xs text-muted">{f.label}</label>
                <input
                  type={f.name.toLowerCase().includes("secret") ? "password" : "text"}
                  placeholder={f.placeholder}
                  value={creds[f.name] ?? ""}
                  onChange={(e) => setCreds((p) => ({ ...p, [f.name]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => connect(connectKey, creds)} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">Connect</button>
            <button onClick={() => setConnectKey(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
          </div>
        </Card>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted">Available to connect</h2>
        <div className="flex flex-wrap gap-2">
          {connectable.map((k) => (
            <button key={k} onClick={() => startConnect(k)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:border-brand hover:text-fg">
              + {LABEL[k] ?? k}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
