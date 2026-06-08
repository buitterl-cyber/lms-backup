import { Card, RiskBadge } from "@/components/ui";
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Certifications</h1>
        <p className="text-sm text-muted">Expiries, CPD progress and automated renewal reminders.</p>
      </header>

      {certs.length === 0 ? (
        <Card>No certifications tracked yet.</Card>
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr className="border-b border-border">
                <th className="p-4 font-medium">Certification</th><th className="font-medium">Holder</th>
                <th className="font-medium">Expires</th><th className="font-medium">Status</th>
                <th className="font-medium">Reminders due</th><th className="p-4 font-medium">CPD</th>
              </tr>
            </thead>
            <tbody>
              {certs.map((c) => (
                <tr key={c.id} className="border-b border-border/60">
                  <td className="p-4 font-medium">{c.certification}</td>
                  <td>{c.user}</td>
                  <td className="text-muted">{c.expiresAt ? String(c.expiresAt).slice(0, 10) : "—"}</td>
                  <td><RiskBadge risk={STATUS_RISK[c.status] ?? "amber"} label={c.status} /></td>
                  <td className="text-muted">{c.reminders.length ? c.reminders.map((d) => `${d}d`).join(", ") : "—"}</td>
                  <td className="p-4 text-muted">{c.cpd ? `${c.cpd.pct}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
