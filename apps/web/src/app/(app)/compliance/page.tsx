import { Card, MetricCard, Meter, RiskBadge } from "@/components/ui";
import { apiGet, getContext, type ComplianceDashboard } from "@/lib/api";

export const dynamic = "force-dynamic";

const DEMO: ComplianceDashboard = {
  departmentId: "cloud-sec",
  risk: { green: 42, amber: 8, red: 3, auditReadiness: 86, status: "red" },
  controls: [
    { controlId: "1", status: "red", framework: "ISO 27001", code: "A.6.3", user: "Amir K", reason: "Expired/missing required certification(s): 1." },
    { controlId: "2", status: "amber", framework: "GDPR", code: "Art.39", user: "Amir K", reason: "1 required course(s) outstanding." },
    { controlId: "3", status: "green", framework: "SOC2", code: "CC1.4", user: "Lena R", reason: "All required training complete and certifications valid." },
  ],
};

async function load() {
  try {
    const ctx = await getContext();
    return await apiGet<ComplianceDashboard>(`/compliance/dashboard?deptId=${ctx.departmentId}`, ctx);
  } catch {
    return DEMO;
  }
}

export default async function CompliancePage() {
  const data = await load();
  const { risk } = data;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Compliance — Cloud &amp; Security</h1>
          <p className="text-sm text-muted">Green / amber / red, recomputed continuously</p>
        </div>
        <RiskBadge risk={risk.status} label={`Audit-ready ${risk.auditReadiness}%`} />
      </header>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Compliant" value={`${risk.green}`} />
        <MetricCard label="Due (amber)" value={`${risk.amber}`} />
        <MetricCard label="At risk (red)" value={`${risk.red}`} />
        <Card>
          <p className="text-sm text-muted">Audit readiness</p>
          <p className="mt-1 text-3xl font-semibold">{risk.auditReadiness}%</p>
          <div className="mt-2"><Meter value={risk.auditReadiness} /></div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-medium">Control evaluations</h2>
          <div className="flex gap-2">
            <button className="rounded-lg border border-border px-3 py-1.5 text-xs">Auto-assign all red</button>
            <button className="rounded-lg bg-brand px-3 py-1.5 text-xs text-white">Launch renewal campaign</button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-border">
              <th className="p-4 font-medium">Status</th><th className="font-medium">Framework</th>
              <th className="font-medium">Control</th><th className="font-medium">Person</th><th className="p-4 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {data.controls.map((c) => (
              <tr key={c.controlId} className="border-b border-border/60">
                <td className="p-4"><RiskBadge risk={c.status} /></td>
                <td>{c.framework}</td>
                <td className="font-mono text-xs">{c.code}</td>
                <td>{c.user}</td>
                <td className="p-4 text-muted">{c.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
