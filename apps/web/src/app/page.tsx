import Link from "next/link";
import { Brand } from "@/components/Brand";
import { BookDemoForm } from "@/components/BookDemoForm";
import { HeroProductVisual } from "@/components/HeroProductVisual";
import { LaunchPopup } from "@/components/LaunchPopup";
import { MarketingHeader } from "@/components/MarketingHeader";
import { Reveal } from "@/components/Reveal";

// Marketing homepage — workforce-readiness intelligence.
// Visual language borrows Docebo’s depth/motion energy; colours stay Riyada navy/teal/gold.

const OUTCOMES = [
  {
    title: "Find critical capability gaps",
    desc: "See missing skills and compliance requirements before they become operational risk.",
  },
  {
    title: "Identify expiring certifications early",
    desc: "Surface renewals and CPD obligations with enough lead time to act.",
  },
  {
    title: "Prioritise training by business risk",
    desc: "Direct learning effort to the roles, teams and controls that matter most.",
  },
] as const;

const CAPABILITIES = [
  {
    title: "Skills Graph",
    desc: "Map roles, skills, certifications and learning requirements into one living model.",
  },
  {
    title: "Gap Intelligence",
    desc: "Identify missing capabilities and prioritise them by risk, role and requirement.",
  },
  {
    title: "Action Layer",
    desc: "Recommend the right intervention using your connected learning providers.",
  },
] as const;

const WORKFLOW = [
  { step: "01", title: "Connect workforce & learning data", desc: "Bring people, roles, certifications and provider catalogues into one intelligence layer." },
  { step: "02", title: "Surface readiness and risk", desc: "See overall readiness alongside the gaps that carry the highest business exposure." },
  { step: "03", title: "Prioritise who needs what", desc: "Drill from org → team → role to understand who is affected and why." },
  { step: "04", title: "Act through existing providers", desc: "Assign or review training without replacing the content sources you already use." },
] as const;

const PROVIDERS = ["GO1", "Microsoft Learn", "AWS Skill Builder", "Cybrary", "Internal knowledge"] as const;

const AGGREGATION = [
  "Lists available training",
  "Measures course completion",
  "Treats teams similarly",
  "Adds more content",
] as const;

const INTELLIGENCE = [
  "Identifies actual workforce gaps",
  "Measures readiness and risk",
  "Prioritises by role, team and requirement",
  "Recommends the right intervention",
] as const;

const MARQUEE = [
  "Skills Graph",
  "Gap intelligence",
  "Risk prioritisation",
  "Certification renewals",
  "Explainable recommendations",
  "Provider-agnostic action",
  "Workforce readiness",
] as const;

export default function Landing() {
  return (
    <div className="mkt-page min-h-screen text-fg">
      <LaunchPopup />
      <MarketingHeader />

      <main>
        {/* —— Hero —— */}
        <section className="relative overflow-hidden" aria-labelledby="hero-heading">
          <div aria-hidden className="mkt-blob mkt-blob-a" />
          <div aria-hidden className="mkt-blob mkt-blob-b" />
          <div aria-hidden className="mkt-blob mkt-blob-c" />
          <div aria-hidden className="mkt-hero-grid" />

          <div className="relative mx-auto grid max-w-[1280px] items-center gap-10 px-5 pb-12 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:grid-cols-[44%_56%] lg:gap-12 lg:pb-16 lg:pt-10">
            <div>
              <p className="rise inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                <span className="h-px w-7 bg-accentTeal" aria-hidden />
                Workforce readiness, without the guesswork
              </p>
              <h1
                id="hero-heading"
                className="rise rise-d1 font-display mt-5 text-[2.25rem] font-semibold leading-[1.08] tracking-tight text-fg sm:text-5xl lg:text-[3.15rem] lg:leading-[1.05]"
              >
                See every skills and compliance gap{" "}
                <span className="mkt-accent-line">before it becomes a risk.</span>
              </h1>
              <p className="rise rise-d2 mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                RiyadaIntel connects your learning, workforce and certification data to show who needs training, what to prioritise and why—across every team and provider.
              </p>
              <div className="rise rise-d3 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a href="#book-demo" className="mkt-btn-demo inline-flex min-h-12 w-full items-center justify-center rounded-full px-7 text-sm font-semibold sm:w-auto">
                  Book a demo
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-12 items-center justify-start gap-2 rounded-full border border-border bg-card/80 px-5 text-sm font-semibold text-fg shadow-sm transition hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-md"
                >
                  See how it works
                  <span aria-hidden className="text-accentTeal">→</span>
                </a>
              </div>
            </div>
            <div className="lg:ps-2">
              <HeroProductVisual />
            </div>
          </div>

          {/* Proof */}
          <div id="customers" className="relative">
            <div className="mx-auto max-w-[1280px] px-5 pb-4 sm:px-6">
              <Reveal className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.25)] backdrop-blur sm:p-8">
                <p className="max-w-3xl text-base font-medium text-fg sm:text-lg">
                  Built for learning, compliance and workforce teams operating across complex organisations.
                </p>
                <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
                  {OUTCOMES.map((item) => (
                    <li
                      key={item.title}
                      className="group rounded-xl border border-border bg-bg/60 p-4 transition duration-200 hover:-translate-y-1 hover:border-accentTeal/40 hover:shadow-md"
                    >
                      <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-accentTeal/15 text-accentTeal transition group-hover:scale-110" aria-hidden>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <p className="text-sm font-semibold text-fg">{item.title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Capability marquee */}
        <div className="mkt-marquee relative overflow-hidden border-y border-border bg-card/50 py-3.5" aria-hidden>
          <div className="mkt-marquee-track">
            {[...MARQUEE, ...MARQUEE].map((item, i) => (
              <span key={`${item}-${i}`} className="flex shrink-0 items-center gap-8 px-4">
                <span className="text-sm font-medium tracking-wide text-muted">{item}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-accentTeal/70" />
              </span>
            ))}
          </div>
        </div>

        {/* —— Intelligence layer —— */}
        <section id="product" className="mkt-mesh relative overflow-hidden py-16 text-white sm:py-20" aria-labelledby="moat-heading">
          <div className="relative mx-auto max-w-[1280px] px-5 sm:px-6">
            <Reveal className="max-w-3xl">
              <h2 id="moat-heading" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem]">
                The content is not the moat.
                <span className="mt-2 block text-accentTeal">The intelligence layer is.</span>
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
                Training content is widely available. The advantage comes from knowing which capabilities matter, where the gaps are, and what action each team should take next.
              </p>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
              <Reveal className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-7">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Course aggregation</h3>
                <ul className="mt-5 space-y-3">
                  {AGGREGATION.map((line) => (
                    <li key={line} className="flex gap-3 text-sm text-white/65">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/35" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delayMs={80} className="rounded-2xl border border-accentTeal/45 bg-accentTeal/10 p-6 shadow-[0_0_40px_-12px_rgba(45,212,191,0.35)] backdrop-blur-sm sm:p-7">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-accentTeal">RiyadaIntel intelligence</h3>
                <ul className="mt-5 space-y-3">
                  {INTELLIGENCE.map((line) => (
                    <li key={line} className="flex gap-3 text-sm text-white">
                      <span className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accentTeal/25 text-[10px] text-accentTeal" aria-hidden>
                        ✓
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <div id="solutions" className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
              {CAPABILITIES.map((cap, i) => (
                <Reveal
                  key={cap.title}
                  delayMs={i * 70}
                  className="group rounded-2xl border border-white/10 bg-white/[0.05] p-6 transition duration-200 hover:-translate-y-1 hover:border-accentTeal/40 hover:bg-white/[0.08]"
                >
                  <p className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-accentTeal">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-white">{cap.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{cap.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* —— Workflow —— */}
        <section id="how-it-works" className="relative border-b border-border py-16 sm:py-20" aria-labelledby="workflow-heading">
          <div aria-hidden className="mkt-blob mkt-blob-d" />
          <div className="relative mx-auto max-w-[1280px] px-5 sm:px-6">
            <Reveal className="max-w-2xl">
              <h2 id="workflow-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                From signal to action in one workflow
              </h2>
              <p className="mt-3 text-muted">
                A focused path from connected data to prioritised interventions—without turning the homepage into a catalogue.
              </p>
            </Reveal>
            <ol className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {WORKFLOW.map((item, i) => (
                <Reveal
                  key={item.step}
                  delayMs={i * 60}
                  as="li"
                  className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-brand/25 hover:shadow-lg"
                >
                  <p className="font-display text-xs font-semibold tracking-wider text-accentTeal">{item.step}</p>
                  <h3 className="mt-2 text-base font-semibold text-fg">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* —— Integrations —— */}
        <section id="integrations" className="border-b border-border bg-card/70 py-16 sm:py-20" aria-labelledby="integrations-heading">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
            <Reveal className="max-w-2xl">
              <h2 id="integrations-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Works with the providers you already use
              </h2>
              <p className="mt-3 text-muted">
                RiyadaIntel sits above your learning stack. Act on gaps without ripping out content sources.
              </p>
            </Reveal>
            <ul className="mt-10 flex flex-wrap gap-3">
              {PROVIDERS.map((p) => (
                <li
                  key={p}
                  className="rounded-full border border-border bg-bg px-5 py-2.5 text-sm font-medium text-fg shadow-sm transition hover:-translate-y-0.5 hover:border-accentTeal/40 hover:shadow-md"
                >
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">
              Provider connectors are part of the platform architecture; availability depends on your deployment.
            </p>
          </div>
        </section>

        {/* —— Resources —— */}
        <section id="resources" className="border-b border-border py-14 sm:py-16" aria-labelledby="resources-heading">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
            <h2 id="resources-heading" className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Resources
            </h2>
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <li>
                <Link href="/login" className="group block rounded-2xl border border-border bg-card px-5 py-5 shadow-sm transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg">
                  <p className="text-sm font-semibold text-fg group-hover:text-brand">Log in to the platform</p>
                  <p className="mt-1 text-sm text-muted">Access learner and admin portals.</p>
                </Link>
              </li>
              <li>
                <a href="#book-demo" className="group block rounded-2xl border border-border bg-card px-5 py-5 shadow-sm transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg">
                  <p className="text-sm font-semibold text-fg group-hover:text-brand">Request a walkthrough</p>
                  <p className="mt-1 text-sm text-muted">See gap intelligence on your use cases.</p>
                </a>
              </li>
              <li>
                <Link href="/courses" className="group block rounded-2xl border border-border bg-card px-5 py-5 shadow-sm transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg">
                  <p className="text-sm font-semibold text-fg group-hover:text-brand">Public catalogue</p>
                  <p className="mt-1 text-sm text-muted">Optional content browsing — secondary to readiness.</p>
                </Link>
              </li>
            </ul>
          </div>
        </section>

        {/* —— Final CTA —— */}
        <section id="book-demo" className="relative overflow-hidden bg-brand py-16 text-white sm:py-20" aria-labelledby="demo-heading">
          <div aria-hidden className="marketing-cta-wash pointer-events-none absolute inset-0" />
          <div aria-hidden className="mkt-orb mkt-orb-cta" />
          <div className="relative mx-auto grid max-w-[1280px] gap-10 px-5 sm:px-6 lg:grid-cols-2 lg:items-start lg:gap-16">
            <Reveal>
              <h2 id="demo-heading" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                See readiness risk before it shows up in an audit
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white/75">
                Book a demo and we&apos;ll walk through how RiyadaIntel maps skills, compliance and certifications onto the teams that need action.
              </p>
            </Reveal>
            <Reveal delayMs={80} className="rounded-2xl border border-white/20 bg-white p-5 text-fg shadow-2xl shadow-black/25 sm:p-6">
              <BookDemoForm />
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card py-10">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <Brand size={24} className="text-sm" />
            <p className="mt-2 text-xs text-muted">
              AI-Powered Workforce Intelligence · Middle East · Europe · Africa · Asia
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted" aria-label="Footer">
            <a href="#product" className="hover:text-fg">Product</a>
            <a href="#integrations" className="hover:text-fg">Integrations</a>
            <Link href="/login" className="hover:text-fg">Log in</Link>
            <a href="#book-demo" className="hover:text-fg">Book a demo</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
