import {
  Card, EmptyState, MetricCard, PriorityList, PriorityRow, PriorityTone,
  ReadinessBar, ReadinessScore, RecommendedActionCard, RiskBadge, Table, Td, Th, Thead,
} from "@/components/ui";
import { apiGet, getContext, type CertExpiring } from "@/lib/api";

// Certification Intelligence — expiries, CPD, and reminder cadence, live.
export const dynamic = "force-dynamic";

const STATUS_RISK: Record<string, "green" | "amber" | "red"> = { valid: "green", expiring: "amber", expired: "red", missing: "red" };

async function load() {
  try {
    const ctx = await getContext();
    return await apiGet<CertExpiring[]>("/certifications/expiring?withinDays=365", ctx);
  } catch {
    return [];
  }
}

export default async function CertificationsPage() {
  const certs = await load();
  const valid = certs.filter((c) => c.status === "valid").length;
  const expiring = certs.filter((c) => c.status === "expiring").length;
  const expired = certs.filter((c) => c.status === "expired" || c.status === "missing").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Certifications</h1>
        <p className="text-sm text-muted">Expiries, CPD progress and automated renewal reminders.</p>
      </header>

      {certs.length === 0 ? (
        <Card>
          <EmptyState
            icon="badge"
            title="No certifications tracked yet"
            description="Certifications appear here as your team earns them, along with expiry and CPD reminders."
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard label="Valid" value={`${valid}`} />
            <MetricCard label="Expiring soon" value={`${expiring}`} />
            <MetricCard label="Expired / missing" value={`${expired}`} />
          </div>

          {(() => {
            const pct = Math.round((valid / certs.length) * 100);
            const priority = [...certs]
              .filter((c) => c.status !== "valid")
              .sort((a, b) => {
                const rank = (s: string) => (s === "expired" || s === "missing" ? 0 : 1);
                if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
                return new Date(a.expiresAt ?? 0).getTime() - new Date(b.expiresAt ?? 0).getTime();
              });
            const top = priority[0];
            const toneFor = (status: string): PriorityTone =>
              status === "expired" || status === "missing" ? "critical" : "high";
            return (
              <Card padding="none">
                <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <ReadinessScore label="Certification readiness" value={pct} />
                    <div className="flex gap-4 text-end">
                      <div>
                        <p className="tnum text-base font-semibold text-red sm:text-lg">{expired}</p>
                        <p className="text-[10px] text-muted sm:text-[11px]">Expired / missing</p>
                      </div>
                      <div>
                        <p className="tnum text-base font-semibold text-amber sm:text-lg">{expiring}</p>
                        <p className="text-[10px] text-muted sm:text-[11px]">Expiring soon</p>
                      </div>
                    </div>
                  </div>

                  <ReadinessBar value={pct} />

                  {priority.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted sm:text-[11px]">Highest-priority renewals</p>
                      <PriorityList>
                        {priority.slice(0, 5).map((c) => (
                          <PriorityRow
                            key={c.id}
                            title={c.certification}
                            subtitle={`${c.user} · ${c.expiresAt ? `expires ${String(c.expiresAt).slice(0, 10)}` : "no record on file"}`}
                            tone={toneFor(c.status)}
                          />
                        ))}
                      </PriorityList>
                    </div>
                  )}

                  {top && (
                    <RecommendedActionCard
                      headline={`Renew ${top.certification} for ${top.user}`}
                      subtext={top.expiresAt ? `Expires ${String(top.expiresAt).slice(0, 10)}` : "No certification on file"}
                    />
                  )}
                </div>
              </Card>
            );
          })()}

          <Card padding="none">
            <Table>
              <Thead>
                <tr className="border-b border-border">
                  <Th>Certification</Th><Th>Holder</Th><Th>Source</Th><Th>Expires</Th>
                  <Th>Status</Th><Th>Reminders due</Th><Th>CPD</Th>
                </tr>
              </Thead>
              <tbody>
                {certs.map((c) => (
                  <tr key={c.id} className="border-b border-border/60">
                    <Td className="font-medium">{c.certification}</Td>
                    <Td>{c.user}</Td>
                    <Td className="text-muted">{c.source === "external" ? "External provider" : "Internal"}</Td>
                    <Td className="text-muted">{c.expiresAt ? String(c.expiresAt).slice(0, 10) : "—"}</Td>
                    <Td><RiskBadge risk={STATUS_RISK[c.status] ?? "amber"} label={c.status} /></Td>
                    <Td className="text-muted">{c.reminders.length ? c.reminders.map((d) => `${d}d`).join(", ") : "—"}</Td>
                    <Td className="text-muted">{c.cpd ? `${c.cpd.pct}%` : "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
