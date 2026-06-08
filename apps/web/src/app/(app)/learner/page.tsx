import { Card, MetricCard, Meter, RiskBadge } from "@/components/ui";
import { EnrollButton } from "@/components/EnrollButton";
import { apiGet, apiPost, getContext, type Recommendation, type SkillGap } from "@/lib/api";

// Intelligence-forward learner home: leads with WHY (gaps, expiries, assignments), then the
// recommended training as a consequence — never a bare course grid. Server component with a
// graceful demo fallback so the page renders before the backend is wired.
export const dynamic = "force-dynamic";

const DEMO_GAP: SkillGap = {
  roleId: "cloud-sec", roleName: "Cloud Security Engineer", coverage: 0.34,
  gaps: [
    { skillId: "azure-sec", name: "Azure Security", deficit: 3, importance: "required", targetLevel: 3, currentLevel: 1 },
    { skillId: "terraform", name: "Terraform", deficit: 3, importance: "required", targetLevel: 3, currentLevel: 1 },
    { skillId: "soc2", name: "SOC2", deficit: 3, importance: "required", targetLevel: 3, currentLevel: 1 },
    { skillId: "iso27001", name: "ISO 27001", deficit: 3, importance: "required", targetLevel: 3, currentLevel: 1 },
  ],
};
const DEMO_RECS: Recommendation[] = [
  { courseId: "1", title: "Azure Security Engineer", providerKey: "ms-learn", reason: "Closes 1 skill gap for your role via ms-learn.", score: 2.7 },
  { courseId: "2", title: "Terraform on AWS", providerKey: "aws", reason: "Closes 1 skill gap for your role via aws.", score: 2.4 },
  { courseId: "3", title: "SOC2 Readiness", providerKey: "cybrary", reason: "Closes 1 skill gap for your role via cybrary.", score: 2.1 },
];

async function load() {
  try {
    const ctx = await getContext();
    const [gap, recs] = await Promise.all([
      apiGet<SkillGap>(`/users/${ctx.userId}/skill-gap?roleId=${ctx.targetRoleId}`, ctx),
      apiPost<{ recommendations: Recommendation[] }>(`/users/${ctx.userId}/recommendations/generate?roleId=${ctx.targetRoleId}`, ctx).then((r) => r.recommendations),
    ]);
    return { gap, recs, name: ctx.userName || "there", live: true };
  } catch {
    return { gap: DEMO_GAP, recs: DEMO_RECS, name: "Amir", live: false }; // demo fallback
  }
}

export default async function LearnerHome() {
  const { gap, recs, name, live } = await load();
  const readiness = Math.round(gap.coverage * 100);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {name}</h1>
          <p className="text-sm text-muted">
            Target role: {gap.roleName}
            <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] ${live ? "bg-green/15 text-green" : "bg-amber/15 text-amber"}`}>
              {live ? "LIVE" : "demo"}
            </span>
          </p>
        </div>
        <RiskBadge risk={readiness >= 75 ? "green" : readiness >= 50 ? "amber" : "red"} label={`Readiness ${readiness}%`} />
      </header>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Workforce Readiness" value={`${readiness}%`} sub="+4 this month" />
        <MetricCard label="Skill gaps" value={`${gap.gaps.length}`} sub="for your target role" />
        <MetricCard label="Certs expiring" value="1" sub="ISO 27001 in 22 days" />
      </div>

      <Card>
        <h2 className="text-sm font-medium text-muted">Why you&apos;re here</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center gap-2"><span className="text-red">●</span> ISO 27001 Lead Auditor expires in 22 days — renew now.</li>
          <li className="flex items-center gap-2"><span className="text-amber">●</span> {gap.gaps.length} skills missing for {gap.roleName}: {gap.gaps.map((g) => g.name).join(", ")}.</li>
          <li className="flex items-center gap-2"><span className="text-brand">◆</span> Assigned: GDPR refresh (compliance control Art.39).</li>
        </ul>
        <div className="mt-4">
          <p className="mb-1 text-xs text-muted">Readiness toward {gap.roleName}</p>
          <Meter value={readiness} />
        </div>
      </Card>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recommended for you</h2>
          <span className="text-xs text-muted">every recommendation explains the why</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {recs.map((r) => (
            <Card key={r.courseId} className="flex flex-col">
              <p className="text-xs uppercase tracking-wide text-muted">{r.providerKey}</p>
              <p className="mt-1 font-medium">{r.title}</p>
              <p className="mt-2 flex-1 text-xs text-muted">{r.reason}</p>
              <EnrollButton courseId={r.courseId} className="mt-4 w-full" />
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
