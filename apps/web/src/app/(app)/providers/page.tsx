"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState, RiskBadge, SkeletonTable } from "@/components/ui";
import { isAdmin, apiGet, apiPost, getContext, type DemoContext, type ProviderConn } from "@/lib/api";
import { AccessDenied } from "@/components/AccessDenied";

// Connection status (ProviderConnection.status) -> the same green/amber/red language used
// everywhere else in the admin portal, so "is this provider healthy" reads consistently next
// to compliance/certification risk badges.
const STATUS_RISK: Record<string, { risk: "green" | "amber" | "red"; label: string }> = {
  active: { risk: "green", label: "Active" },
  error: { risk: "red", label: "Error" },
  disabled: { risk: "amber", label: "Disabled" },
};
type SyncOutcome = { ok: boolean; detail: string; at: Date };

// Admin → Providers: connect learning providers (incl. a client's own LearnWorlds school) and sync
// their catalogs into the aggregation hub.
const LABEL: Record<string, string> = {
  go1: "GO1", "ms-learn": "Microsoft Learn", "aws-skill-builder": "AWS Skill Builder", learnworlds: "LearnWorlds",
  "open-sesame": "OpenSesame", "internal:confluence": "Confluence", "internal:sharepoint": "SharePoint",
  "internal:google-drive": "Google Drive", "internal:m365": "Microsoft 365", "internal:notion": "Notion",
};
const REAL = new Set(["ms-learn"]);
// Credentials can be entered for these, but the connector's API calls are still stubbed pending
// real docs/sandbox access from the provider — distinct from "live OAuth pending" (no credential
// form at all yet). See packages/providers/src/providers/go1.provider.ts.
const STUBBED_ENDPOINTS = new Set(["go1"]);
// Providers that need credentials before they can connect.
const CRED_FIELDS: Record<string, { name: string; label: string; placeholder: string }[]> = {
  learnworlds: [
    { name: "school", label: "School URL", placeholder: "yourschool.learnworlds.com" },
    { name: "clientId", label: "Client ID", placeholder: "Lw-Client id" },
    { name: "clientSecret", label: "Client secret", placeholder: "••••••••" },
  ],
  // GO1's real field set is unconfirmed pending API docs from GO1 — this is the standard
  // OAuth2 client-credentials pair every content-aggregator API needs at minimum.
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
  const [connecting, setConnecting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  // Per-connection last-sync outcome — a durable-per-row indicator (not just a page-level
  // toast) so an admin scanning the list can see at a glance which connections' last sync
  // succeeded, failed, or hasn't run yet — the "sync status" surface GO1 (or any provider)
  // needs once it's actually connected.
  const [lastSync, setLastSync] = useState<Record<string, SyncOutcome>>({});
  const [connectKey, setConnectKey] = useState<string | null>(null);
  const [creds, setCreds] = useState<Record<string, string>>({});
  // Distinguishes "haven't fetched yet" from "genuinely zero connections" — without this, the
  // list briefly (and incorrectly) claims "No providers connected yet" before the real data loads.
  const [initialLoading, setInitialLoading] = useState(true);

  async function refresh(c: DemoContext) {
    setAvailable(await apiGet<string[]>("/providers/available", c));
    setConns(await apiGet<ProviderConn[]>("/providers/connections", c));
  }
  useEffect(() => {
    getContext().then((c) => { setCtx(c); return refresh(c); }).catch(() => {}).finally(() => setInitialLoading(false));
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
    const fields = CRED_FIELDS[providerKey];
    if (fields && fields.some((f) => !credentials[f.name]?.trim())) {
      setMsg({ text: "Fill in all the fields above before connecting.", tone: "error" });
      return;
    }
    setMsg(null);
    setConnecting(true);
    try {
      await apiPost("/providers/connections", ctx, { providerKey, displayName: LABEL[providerKey] ?? providerKey, credentials });
      setConnectKey(null);
      setMsg({ text: `Connected ${LABEL[providerKey] ?? providerKey}.`, tone: "success" });
      await refresh(ctx);
    } catch {
      setMsg({ text: `Couldn't connect ${LABEL[providerKey] ?? providerKey} — check the credentials and try again.`, tone: "error" });
    } finally {
      setConnecting(false);
    }
  }
  async function sync(id: string) {
    if (!ctx) return;
    setSyncing(id);
    setMsg(null);
    try {
      const r = await apiPost<{ coursesUpserted?: number; skillsCreated?: number }>(`/providers/connections/${id}/sync`, ctx);
      const detail = `Synced ${r.coursesUpserted ?? 0} courses, ${r.skillsCreated ?? 0} new skills.`;
      setMsg({ text: detail, tone: "success" });
      setLastSync((p) => ({ ...p, [id]: { ok: true, detail, at: new Date() } }));
      await refresh(ctx);
    } catch {
      const detail = "Sync failed — check the connection's credentials.";
      setMsg({ text: detail, tone: "error" });
      setLastSync((p) => ({ ...p, [id]: { ok: false, detail, at: new Date() } }));
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
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Providers</h1>
        <p className="text-sm text-muted">Connect learning providers — including a client&apos;s own LearnWorlds school — and sync catalogs into one hub.</p>
      </header>

      {msg && <Card className={`text-sm ${msg.tone === "success" ? "text-green" : "text-red"}`} role={msg.tone === "error" ? "alert" : undefined}>{msg.text}</Card>}

      {initialLoading ? (
        <SkeletonTable />
      ) : (
      <Card padding="none">
        <div className="border-b border-border p-4 text-sm font-medium">Connected ({conns.length})</div>
        {conns.length === 0 ? (
          <EmptyState
            icon="empty"
            title="No providers connected yet"
            description="Connect one below to start syncing its catalog into this hub."
          />
        ) : (
          conns.map((c) => {
            const outcome = lastSync[c.id];
            const statusInfo = STATUS_RISK[c.status] ?? { risk: "amber" as const, label: c.status };
            return (
              <div key={c.id} className="flex flex-col gap-3 border-b border-border/60 p-4 last:border-0 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{LABEL[c.providerKey] ?? c.displayName}</p>
                    <RiskBadge risk={statusInfo.risk} label={statusInfo.label} />
                  </div>
                  <p className="text-xs text-muted">
                    {c.courses} courses{c.lastSyncedAt ? ` · last synced ${new Date(c.lastSyncedAt).toLocaleString()}` : " · never synced"}
                    {REAL.has(c.providerKey)
                      ? ""
                      : STUBBED_ENDPOINTS.has(c.providerKey)
                        ? " · endpoints stubbed, pending provider docs"
                        : CRED_FIELDS[c.providerKey]
                          ? ""
                          : " · live OAuth pending"}
                  </p>
                  {outcome && (
                    <p className={`mt-1 text-xs ${outcome.ok ? "text-green" : "text-red"}`}>
                      {outcome.ok ? "✓" : "✗"} {outcome.detail} ({outcome.at.toLocaleTimeString()})
                    </p>
                  )}
                </div>
                <button onClick={() => sync(c.id)} disabled={syncing === c.id} className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                  {syncing === c.id ? "Syncing…" : "Sync catalog"}
                </button>
              </div>
            );
          })
        )}
      </Card>
      )}

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
            <button onClick={() => connect(connectKey, creds)} disabled={connecting} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {connecting ? "Connecting…" : "Connect"}
            </button>
            <button onClick={() => setConnectKey(null)} disabled={connecting} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-60">Cancel</button>
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
