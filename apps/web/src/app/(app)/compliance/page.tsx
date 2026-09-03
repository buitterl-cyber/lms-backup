import {
  Button, Card, EmptyState, MetricCard, PriorityList, PriorityRow, PriorityTone,
  ReadinessBar, ReadinessScore, RecommendedActionCard, RiskBadge, Table, Td, Th, Thead,
} from "@/components/ui";
import { RiskDonut } from "@/components/charts";
import { apiGet, getContext, type ComplianceDashboard } from "@/lib/api";

export const dynamic = "force-dynamic";

const DEMO: ComplianceDashboard = {
  departmentId: "cloud-sec",
  risk: { green: 42, amber: 8, red: 3, auditReadiness: 86, status: "red" },
  controls: [
    { controlId: "1", status: "red", framework: "ISO 27001", code: "A.6.3", user: "Team Member", reason: "Expired/missing required certification(s): 1." },
    { controlId: "2", status: "amber", framework: "GDPR", code: "Art.39", user: "Team Member", reason: "1 required course(s) outstanding." },
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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold leading-snug sm:text-2xl">Compliance — Cloud &amp; Security</h1>
          <p className="text-sm text-muted">Green / amber / red, recomputed continuously</p>
        </div>
        <RiskBadge risk={risk.status} label={`Audit-ready ${risk.auditReadiness}%`} />
      </header>

      {(() => {
        const priority = [...data.controls]
          .filter((c) => c.status !== "green")
          .sort((a, b) => (a.status === "red" ? 0 : 1) - (b.status === "red" ? 0 : 1));
        const top = priority[0];
        const toneFor = (status: "green" | "amber" | "red"): PriorityTone => (status === "red" ? "critical" : "high");
        return (
          <Card padding="none">
            <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <ReadinessScore label="Audit readiness" value={risk.auditReadiness} />
                <div className="flex gap-4 text-end">
                  <div>
                    <p className="tnum text-base font-semibold text-red sm:text-lg">{risk.red}</p>
                    <p className="text-[10px] text-muted sm:text-[11px]">At risk</p>
                  </div>
                  <div>
                    <p className="tnum text-base font-semibold text-amber sm:text-lg">{risk.amber}</p>
                    <p className="text-[10px] text-muted sm:text-[11px]">Due soon</p>
                  </div>
                </div>
              </div>

              <ReadinessBar value={risk.auditReadiness} />

              {priority.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted sm:text-[11px]">Highest-priority controls</p>
                  <PriorityList>
                    {priority.slice(0, 5).map((c) => (
                      <PriorityRow
                        key={c.controlId}
                        title={`${c.framework} · ${c.code}`}
                        subtitle={`${c.user} — ${c.reason}`}
                        tone={toneFor(c.status)}
                      />
                    ))}
                  </PriorityList>
                </div>
              )}

              {top && <RecommendedActionCard headline={`Resolve ${top.framework} ${top.code} for ${top.user}`} subtext={top.reason} />}
            </div>
          </Card>
        );
      })()}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-muted">Compliance breakdown</p>
          <RiskDonut green={risk.green} amber={risk.amber} red={risk.red} centerValue={`${risk.auditReadiness}%`} centerLabel="audit ready" />
          <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-muted">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green" /> Compliant</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber" /> Due</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red" /> At risk</span>
          </div>
        </Card>
        <MetricCard label="Compliant" value={`${risk.green}`} />
        <MetricCard label="Due (amber)" value={`${risk.amber}`} />
        <MetricCard label="At risk (red)" value={`${risk.red}`} />
      </div>

      <Card padding="none">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-medium">Control evaluations</h2>
          <div className="flex gap-2">
            <Button
              variant="secondary" size="sm" className="hover:bg-bg!" disabled
              title="Bulk compliance actions are on the roadmap — not wired up yet"
            >
              Auto-assign all red
            </Button>
            <Button size="sm" disabled title="Bulk compliance actions are on the roadmap — not wired up yet">
              Launch renewal campaign
            </Button>
          </div>
        </div>
        {data.controls.length === 0 ? (
          <EmptyState
            icon="badge"
            title="No control evaluations yet"
            description="Control evaluations appear here once assessments and certifications are on file for this department."
          />
        ) : (
          <Table>
            <Thead>
              <tr className="border-b border-border">
                <Th>Status</Th><Th>Framework</Th><Th>Control</Th><Th>Person</Th><Th>Reason</Th>
              </tr>
            </Thead>
            <tbody>
              {data.controls.map((c) => (
                <tr key={c.controlId} className="border-b border-border/60">
                  <Td><RiskBadge risk={c.status} /></Td>
                  <Td>{c.framework}</Td>
                  <Td className="font-mono text-xs">{c.code}</Td>
                  <Td>{c.user}</Td>
                  <Td className="text-muted">{c.reason}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
