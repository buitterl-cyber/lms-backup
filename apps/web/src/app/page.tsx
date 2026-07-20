import Link from "next/link";
import { Brand } from "@/components/Brand";
import { LaunchPopup } from "@/components/LaunchPopup";
import { HeroDashboardMock } from "@/components/HeroDashboardMock";
import { PillarIcon, type PillarIconKind } from "@/components/PillarIcon";
import { Reveal } from "@/components/Reveal";
import {
  CapabilityMarquee,
  CountUp,
  HeroOrbs,
  MarketingNav,
} from "@/components/MarketingMotion";
import { Chevron } from "@/components/ui";

// Marketing landing — immersive, motion-led public face of RiyadaIntel.
// Copy/positioning stays fixed; this pass is production visual + continuous motion.

const MARQUEE = [
  "Skills Graph",
  "Gap analysis",
  "ISO · GDPR · NIS2 · SOC2",
  "Certification renewals",
  "Career roadmaps",
  "Explainable AI",
  "GO1 catalog",
  "40,000+ courses",
  "Middle East · Europe · Africa · Asia",
] as const;

const PROOF = [
  { kind: "count" as const, end: 40000, suffix: "+", label: "Courses tracked" },
  { kind: "text" as const, value: "ISO · GDPR · NIS2 · SOC2", label: "Compliance frameworks" },
  { kind: "text" as const, value: "GO1", label: "Content partner" },
  { kind: "count" as const, end: 4, suffix: "", label: "Regions worldwide" },
];

function Pillar({
  icon,
  title,
  desc,
  accent = false,
}: {
  icon: PillarIconKind;
  title: string;
  desc: string;
  accent?: boolean;
}) {
  return (
    <article className={`mkt-feature-card group h-full ${accent ? "mkt-feature-card-dark" : ""}`}>
      <span className={`mkt-feature-icon ${accent ? "mkt-feature-icon-dark" : ""}`}>
        <PillarIcon kind={icon} className="h-7 w-7" />
      </span>
      <div className="min-w-0">
        <h3 className={`font-display text-lg font-semibold ${accent ? "text-white" : ""}`}>{title}</h3>
        <p className={`mt-2 text-sm leading-relaxed ${accent ? "text-white/70" : "text-muted"}`}>{desc}</p>
      </div>
    </article>
  );
}

export default function Landing() {
  return (
    <div className="relative bg-bg">
      <LaunchPopup />

      {/* —— Immersive dark hero (Docebo-style full-bleed plane) —— */}
      <section className="relative overflow-hidden bg-heroPanel text-white">
        <HeroOrbs />

        <MarketingNav>
          <Brand size={28} className="text-lg text-white [&_.font-display>span]:text-accentTeal" />
          <nav className="flex items-center gap-2 text-sm sm:gap-3">
            <Link href="/courses" className="hidden text-white/70 transition hover:text-white sm:inline">
              Courses
            </Link>
            <Link href="/login" className="text-white/70 transition hover:text-white">
              Log in
            </Link>
            <Link href="/signup" className="hidden text-white/70 transition hover:text-white sm:inline">
              Sign up
            </Link>
            <Link
              href="/learner"
              className="inline-flex items-center justify-center rounded-xl bg-accentTeal px-4 py-2 text-sm font-semibold text-accentTealInk shadow-lg shadow-black/25 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Launch platform
            </Link>
          </nav>
        </MarketingNav>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-24 lg:pt-14">
          <div className="text-center lg:text-left">
            <p className="rise inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-accentTeal">
              <span className="h-px w-6 bg-accentTeal/80" />
              AI-Powered Workforce Intelligence Platform
            </p>
            <h1 className="rise rise-d1 font-display mt-6 text-[2.75rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-[3.75rem]">
              Stop buying courses.<br />
              <span className="mkt-gradient-text">Start closing gaps.</span>
            </h1>
            <p className="rise rise-d2 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70 lg:mx-0">
              RiyadaIntel connects skills, compliance, certifications, careers and learning from every
              major training provider into a single intelligence layer — and tells you who needs what
              training, and why.
            </p>
            <div className="rise rise-d3 mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                href="/learner"
                className="mkt-cta-primary inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold"
              >
                Explore the platform <Chevron className="ms-1" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-lg"
              >
                Browse the course catalogue
              </Link>
            </div>
          </div>

          <div className="relative">
            {/* Floating notification chip — layered depth like competitor heroes */}
            <div className="rise rise-d5 mkt-float-slow absolute -left-2 top-8 z-20 hidden rounded-xl border border-white/15 bg-heroPanel/90 px-3 py-2 shadow-xl backdrop-blur md:block lg:-left-6">
              <p className="flex items-center gap-2 text-[11px] text-white/90">
                <span className="h-2 w-2 rounded-full bg-heroTeal mkt-pulse" />
                Gap closed — SOC2 Auditing
              </p>
              <p className="mt-0.5 text-[10px] text-white/45">Amir K · just now</p>
            </div>
            <div className="rise rise-d6 mkt-float absolute -bottom-2 -right-1 z-20 hidden rounded-xl border border-white/15 bg-brand/90 px-3 py-2 shadow-xl backdrop-blur sm:block lg:-right-4">
              <p className="text-[10px] uppercase tracking-wider text-white/60">Team readiness</p>
              <p className="tnum text-lg font-semibold text-accentTeal">72%</p>
            </div>
            <HeroDashboardMock />
          </div>
        </div>

        <CapabilityMarquee items={MARQUEE} />
      </section>

      {/* Proof — count-up stats on a light band */}
      <section className="relative border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 md:grid-cols-4">
          {PROOF.map((item, i) => (
            <Reveal
              key={item.label}
              delayMs={i * 80}
              className="border-border px-5 py-8 text-center md:border-r md:last:border-r-0 [&:nth-child(odd)]:border-r"
            >
              <p className="font-display text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                {item.kind === "count" ? (
                  <CountUp end={item.end} suffix={item.suffix} />
                ) : (
                  <span className="text-base sm:text-lg">{item.value}</span>
                )}
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted">{item.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Moat — animated mesh band */}
      <section className="mkt-mesh relative overflow-hidden py-20">
        <Reveal className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            The content is not the moat.
          </h2>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-accentTeal sm:text-3xl">
            The intelligence layer is.
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70">
            Everyone can resell the same courses. RiyadaIntel owns the Skills Graph, the gap analysis, and the compliance, certification and career reasoning that turn a catalog into workforce readiness.
          </p>
        </Reveal>
      </section>

      {/* Feature grid — larger, icon-forward, continuous hover life */}
      <section className="relative overflow-hidden py-20">
        <div aria-hidden className="marketing-hero-wash pointer-events-none absolute inset-0 opacity-80" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Reveal delayMs={0} className="md:col-span-2">
              <Pillar
                icon="skills"
                title="Skills Intelligence"
                desc="A living Skills Graph maps people, roles, courses and certifications — and finds every gap. Everything else on this page is built on top of it."
              />
            </Reveal>
            <Reveal delayMs={90}>
              <Pillar
                icon="compliance"
                title="Compliance Intelligence"
                desc="ISO, GDPR, NIS2, SOC2 and more — green / amber / red, with audit readiness."
              />
            </Reveal>
            <Reveal delayMs={40}>
              <Pillar
                icon="career"
                title="Career Intelligence"
                desc="Pick a target role; get a prerequisite-ordered roadmap with time and cost."
              />
            </Reveal>
            <Reveal delayMs={120}>
              <Pillar
                icon="certification"
                title="Certification Intelligence"
                desc="Track expiries, CPD and renewals; automate reminders before they lapse."
              />
            </Reveal>
            <Reveal delayMs={160}>
              <Pillar
                icon="aggregation"
                title="Content Aggregation Hub"
                desc="One catalog across every major provider and your own internal knowledge."
              />
            </Reveal>
            <Reveal delayMs={200} className="md:col-span-3">
              <Pillar
                accent
                icon="ai"
                title="AI Recommendation Engine"
                desc="Every assignment is explainable — the system tells you the why. This is the layer the rest of the platform reports up to."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-brand py-20 text-white">
        <div aria-hidden className="marketing-cta-wash pointer-events-none absolute inset-0" />
        <div aria-hidden className="mkt-orb mkt-orb-cta" />
        <Reveal className="relative mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">See it on live data</h2>
          <p className="max-w-xl text-base leading-relaxed text-white/75">
            A seeded demo organization is loaded — explore the learner dashboard, the aggregated catalog, compliance and RIYADA AI.
          </p>
          <Link
            href="/login"
            className="mkt-cta-primary mt-3 inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-sm font-semibold"
          >
            Log in to the demo <Chevron className="ms-1" />
          </Link>
        </Reveal>
      </section>

      <footer className="border-t border-border bg-card py-10 text-center text-xs text-muted">
        <p className="font-display text-sm font-semibold text-fg">RiyadaIntel</p>
        <p className="mt-2">AI-Powered Workforce Intelligence · Middle East · Europe · Africa · Asia</p>
      </footer>
    </div>
  );
}
