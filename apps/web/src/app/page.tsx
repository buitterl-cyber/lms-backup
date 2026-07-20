import Link from "next/link";
import { Brand } from "@/components/Brand";
import { LaunchPopup } from "@/components/LaunchPopup";
import { HeroDashboardMock } from "@/components/HeroDashboardMock";
import { PillarIcon, type PillarIconKind } from "@/components/PillarIcon";
import { Reveal } from "@/components/Reveal";
import { Button, Card, Chevron } from "@/components/ui";

// Marketing landing — the public face of RiyadaIntel. Full-bleed (outside the app sidebar).
// Social-proof figures below are only claims already used on this site / product copy —
// no invented customer names or unverified headcount.

/** Aggregate / capability proof already stated elsewhere on the site — not invented logos. */
const PROOF = [
  { value: "40,000+", label: "Courses tracked" },
  { value: "ISO · GDPR · NIS2 · SOC2", label: "Compliance frameworks" },
  { value: "GO1", label: "Content partner" },
  { value: "4 regions", label: "Middle East · Europe · Africa · Asia" },
] as const;

/** Standard-emphasis pillar card — icon in a neutral tinted box, plain Card. Skills
 *  Intelligence and AI Recommendation Engine (below) get their own bespoke, larger treatment
 *  since they're the two pillars most central to the product's pitch. */
function Pillar({ icon, title, desc }: { icon: PillarIconKind; title: string; desc: string }) {
  return (
    <Card interactive>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bg text-brand ring-1 ring-border">
          <PillarIcon kind={icon} />
        </span>
        <div className="min-w-0">
          <h3 className="font-medium">{title}</h3>
          <p className="mt-1 text-sm text-muted">{desc}</p>
        </div>
      </div>
    </Card>
  );
}

export default function Landing() {
  return (
    <div className="relative">
      <LaunchPopup />
      {/* Soft brand wash behind the hero — aurora tokens, not a flat white sheet */}
      <div aria-hidden className="marketing-hero-wash pointer-events-none absolute inset-x-0 top-0 h-[520px]" />

      {/* nav */}
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Brand size={28} className="text-lg" />
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/courses" className="text-muted transition hover:text-fg">Courses</Link>
          <Link href="/login" className="text-muted transition hover:text-fg">Log in</Link>
          <Link href="/signup" className="text-muted transition hover:text-fg">Sign up</Link>
          <Button href="/learner">Launch platform</Button>
        </nav>
      </header>

      {/* hero — text left (~55%), product UI mock right (~45%); stacks on mobile */}
      <section className="relative mx-auto max-w-6xl px-6 pb-8 pt-14">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[55%_45%]">
          <div className="text-center lg:text-left">
            <p className="rise text-xs font-medium uppercase tracking-[0.2em] text-brand">
              AI-Powered Workforce Intelligence Platform
            </p>
            <h1 className="rise rise-d1 mt-5 text-5xl font-semibold leading-[1.05] tracking-tight">
              Stop buying courses.<br />Start closing gaps.
            </h1>
            <p className="rise rise-d2 mx-auto mt-6 max-w-2xl text-lg text-muted lg:mx-0">
              RiyadaIntel connects skills, compliance, certifications, careers and learning from every
              major training provider into a single intelligence layer — and tells you who needs what
              training, and why.
            </p>
            <div className="rise rise-d3 mt-8 flex items-center justify-center gap-3 lg:justify-start">
              <Button href="/learner" size="lg">Explore the platform <Chevron className="ms-1" /></Button>
              <Button href="/courses" variant="secondary" size="lg">Browse the course catalogue</Button>
            </div>
          </div>
          <HeroDashboardMock />
        </div>
      </section>

      {/* Social proof — aggregate / capability strip under the hero, before the feature grid.
          Values are already used on-site (hero mock, compliance copy, footer regions, GO1). */}
      <section className="relative border-y border-border bg-card/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border md:grid-cols-4">
          {PROOF.map((item, i) => (
            <Reveal key={item.label} delayMs={i * 70} className="bg-card px-5 py-6 text-center">
              <p className="font-display text-sm font-semibold tracking-tight text-fg sm:text-base">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-muted">{item.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* moat — full-bleed navy + teal band */}
      <section className="bg-heroPanel py-16">
        <Reveal className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-2xl font-semibold text-white">The content is not the moat.</h2>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-accentTeal">The intelligence layer is.</p>
          <p className="mt-4 text-white/70">Everyone can resell the same courses. RiyadaIntel owns the Skills Graph, the gap analysis, and the compliance, certification and career reasoning that turn a catalog into workforce readiness.</p>
        </Reveal>
      </section>

      {/* layers — Skills Intelligence + AI Recommendation Engine get larger treatment */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Reveal delayMs={0} className="md:col-span-2">
            <Card interactive className="h-full">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <PillarIcon kind="skills" className="h-7 w-7" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold">Skills Intelligence</h3>
                  <p className="mt-1 text-sm text-muted">A living Skills Graph maps people, roles, courses and certifications — and finds every gap. Everything else on this page is built on top of it.</p>
                </div>
              </div>
            </Card>
          </Reveal>
          <Reveal delayMs={80}>
            <Pillar icon="compliance" title="Compliance Intelligence" desc="ISO, GDPR, NIS2, SOC2 and more — green / amber / red, with audit readiness." />
          </Reveal>
          <Reveal delayMs={40}>
            <Pillar icon="career" title="Career Intelligence" desc="Pick a target role; get a prerequisite-ordered roadmap with time and cost." />
          </Reveal>
          <Reveal delayMs={120}>
            <Pillar icon="certification" title="Certification Intelligence" desc="Track expiries, CPD and renewals; automate reminders before they lapse." />
          </Reveal>
          <Reveal delayMs={160}>
            <Pillar icon="aggregation" title="Content Aggregation Hub" desc="One catalog across every major provider and your own internal knowledge." />
          </Reveal>
          <Reveal delayMs={200} className="md:col-span-3">
            <Card tone="none" interactive className="bg-heroPanel ring-1 ring-white/10">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accentTeal">
                  <PillarIcon kind="ai" className="h-7 w-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold text-white">AI Recommendation Engine</h3>
                  <p className="mt-1 text-sm text-white/70">Every assignment is explainable — the system tells you the why. This is the layer the rest of the platform reports up to.</p>
                </div>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Full-bleed CTA band — second colored plane beyond the moat, brand + teal tokens */}
      <section className="relative overflow-hidden bg-brand py-16 text-white">
        <div aria-hidden className="marketing-cta-wash pointer-events-none absolute inset-0" />
        <Reveal className="relative mx-auto flex max-w-3xl flex-col items-center gap-3 px-6 text-center">
          <h2 className="font-display text-2xl font-semibold">See it on live data</h2>
          <p className="max-w-xl text-white/75">A seeded demo organization is loaded — explore the learner dashboard, the aggregated catalog, compliance and RIYADA AI.</p>
          <Link
            href="/login"
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-accentTeal px-5 py-3 text-sm font-medium text-accentTealInk shadow-md shadow-black/20 transition duration-200 ease-out hover:-translate-y-0.5 hover:opacity-95 hover:shadow-lg"
          >
            Log in to the demo <Chevron className="ms-1" />
          </Link>
        </Reveal>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted">
        RiyadaIntel · AI-Powered Workforce Intelligence · Middle East · Europe · Africa · Asia
      </footer>
    </div>
  );
}
