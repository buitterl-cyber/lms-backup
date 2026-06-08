import { Card } from "@/components/ui";

// Marketplace — intelligence-led subscriptions + content packages. Tiers reflect the business
// model (value metric = active learner / year); content is BYOL or bought here.
const TIERS = [
  { name: "Essentials", price: "$18–30", per: "learner / yr", for: "SMB", feats: ["LMS + catalog aggregation", "Basic reporting"] },
  { name: "Intelligence", price: "$40–70", per: "learner / yr", for: "Mid-market", feats: ["+ Skills Graph & gap analysis", "+ Compliance & certification intelligence", "+ RIYADA AI"], highlight: true },
  { name: "Enterprise", price: "$80–140", per: "learner / yr", for: "Large orgs / MSPs", feats: ["+ SSO/SCIM, career intelligence", "+ AI Knowledge Academy", "+ White-label, API, premium support"] },
  { name: "Government", price: "Custom", per: "", for: "Gov / sovereign", feats: ["+ Data residency / on-prem AI", "+ Dedicated tenant", "+ Procurement & pro-services"] },
];

const PACKS = [
  { name: "Cybersecurity Track", kind: "Certification Track", n: "ISO 27001 · SOC2 · NIS2" },
  { name: "Cloud Engineer Bundle", kind: "Skill Track", n: "AWS · Azure · Terraform" },
  { name: "Compliance Essentials", kind: "Corporate Package", n: "GDPR · ISO 9001 · Cyber Essentials" },
];

export default function MarketplacePage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Marketplace</h1>
        <p className="text-sm text-muted">Intelligence subscriptions, skill tracks, and certification bundles.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {TIERS.map((t) => (
          <Card key={t.name} className={t.highlight ? "ring-1 ring-brand" : ""}>
            {t.highlight && <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-brand">Most popular</p>}
            <p className="font-medium">{t.name}</p>
            <p className="text-xs text-muted">{t.for}</p>
            <p className="mt-3 text-2xl font-semibold">{t.price}</p>
            {t.per && <p className="text-xs text-muted">{t.per}</p>}
            <ul className="mt-3 space-y-1 text-xs text-muted">
              {t.feats.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <button className="mt-4 w-full rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white">Choose plan</button>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Tracks & bundles</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PACKS.map((p) => (
            <Card key={p.name}>
              <p className="text-xs uppercase tracking-wide text-muted">{p.kind}</p>
              <p className="mt-1 font-medium">{p.name}</p>
              <p className="mt-1 text-sm text-muted">{p.n}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
