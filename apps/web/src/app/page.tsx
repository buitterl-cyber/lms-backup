import Link from "next/link";
import { Brand } from "@/components/Brand";
import { BookDemoForm } from "@/components/BookDemoForm";
import { HeroProductVisual } from "@/components/HeroProductVisual";
import { LaunchPopup } from "@/components/LaunchPopup";
import { MarketingHeader } from "@/components/MarketingHeader";
import { Reveal } from "@/components/Reveal";

// Marketing homepage — workforce-readiness intelligence positioning (not a course marketplace).
// Copy is kept inline and editable like the rest of the project.

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

/** Provider names already present in the product/connectors — not invented partners. */
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

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <LaunchPopup />
      <MarketingHeader />

      <main>
        {/* —— Hero —— */}
        <section className="relative overflow-hidden border-b border-border" aria-labelledby="hero-heading">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(rgb(var(--border) / 0.7) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--border) / 0.7) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse 70% 60% at 70% 40%, black, transparent)",
            }}
          />
          <div className="relative mx-auto grid max-w-[1280px] items-center gap-10 px-5 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:grid-cols-[44%_56%] lg:gap-12 lg:pb-20 lg:pt-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                Workforce readiness, without the guesswork
              </p>
              <h1 id="hero-heading" className="font-display mt-4 text-[2.1rem] font-semibold leading-[1.12] tracking-tight text-fg sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
                See every skills and compliance gap before it becomes a risk.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                RiyadaIntel connects your learning, workforce and certification data to show who needs training, what to prioritise and why—across every team and provider.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#book-demo"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand px-6 text-sm font-semibold text-white transition hover:opacity-95 sm:w-auto"
                >
                  Book a demo
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-11 items-center justify-start px-1 text-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                  See how it works
                </a>
              </div>
            </div>
            <div className="lg:ps-2">
              <HeroProductVisual />
            </div>
          </div>

          {/* Proof — connected to hero, not a stats spreadsheet */}
          <div id="customers" className="relative border-t border-border bg-card/60">
            <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-6 sm:py-12">
              <p className="max-w-3xl text-base font-medium text-fg sm:text-lg">
                Built for learning, compliance and workforce teams operating across complex organisations.
              </p>
              <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
                {OUTCOMES.map((item) => (
                  <li key={item.title} className="border-s-2 border-accentTeal ps-4">
                    <p className="text-sm font-semibold text-fg">{item.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* —— Intelligence layer —— */}
        <section id="product" className="bg-heroPanel py-16 text-white sm:py-20" aria-labelledby="moat-heading">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
            <Reveal className="max-w-3xl">
              <h2 id="moat-heading" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                The content is not the moat.
                <span className="mt-2 block text-accentTeal">The intelligence layer is.</span>
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
                Training content is widely available. The advantage comes from knowing which capabilities matter, where the gaps are, and what action each team should take next.
              </p>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
              <Reveal className="rounded-lg border border-white/10 bg-white/[0.03] p-6 sm:p-7">
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
              <Reveal delayMs={80} className="rounded-lg border border-accentTeal/40 bg-accentTeal/10 p-6 sm:p-7 ring-1 ring-accentTeal/20">
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

            {/* Capability cards */}
            <div id="solutions" className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
              {CAPABILITIES.map((cap, i) => (
                <Reveal key={cap.title} delayMs={i * 70} className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
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
        <section id="how-it-works" className="border-b border-border py-16 sm:py-20" aria-labelledby="workflow-heading">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
            <Reveal className="max-w-2xl">
              <h2 id="workflow-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                From signal to action in one workflow
              </h2>
              <p className="mt-3 text-muted">
                A focused path from connected data to prioritised interventions—without turning the homepage into a catalogue.
              </p>
            </Reveal>
            <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {WORKFLOW.map((item, i) => (
                <Reveal key={item.step} delayMs={i * 60} as="li" className="relative border-t border-border pt-5">
                  <p className="font-display text-xs font-semibold tracking-wider text-accentTeal">{item.step}</p>
                  <h3 className="mt-2 text-base font-semibold text-fg">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* —— Integrations —— */}
        <section id="integrations" className="border-b border-border bg-card py-16 sm:py-20" aria-labelledby="integrations-heading">
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
                  className="rounded-md border border-border bg-bg px-4 py-2.5 text-sm font-medium text-fg"
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

        {/* —— Resources (thin, factual) —— */}
        <section id="resources" className="border-b border-border py-14 sm:py-16" aria-labelledby="resources-heading">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
            <h2 id="resources-heading" className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Resources
            </h2>
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <li>
                <Link href="/login" className="block rounded-lg border border-border px-4 py-4 transition hover:border-brand/30 hover:bg-card">
                  <p className="text-sm font-semibold text-fg">Log in to the platform</p>
                  <p className="mt-1 text-sm text-muted">Access learner and admin portals.</p>
                </Link>
              </li>
              <li>
                <a href="#book-demo" className="block rounded-lg border border-border px-4 py-4 transition hover:border-brand/30 hover:bg-card">
                  <p className="text-sm font-semibold text-fg">Request a walkthrough</p>
                  <p className="mt-1 text-sm text-muted">See gap intelligence on your use cases.</p>
                </a>
              </li>
              <li>
                <Link href="/courses" className="block rounded-lg border border-border px-4 py-4 transition hover:border-brand/30 hover:bg-card">
                  <p className="text-sm font-semibold text-fg">Public catalogue</p>
                  <p className="mt-1 text-sm text-muted">Optional content browsing — secondary to readiness.</p>
                </Link>
              </li>
            </ul>
          </div>
        </section>

        {/* —— Final CTA —— */}
        <section id="book-demo" className="bg-brand py-16 text-white sm:py-20" aria-labelledby="demo-heading">
          <div className="mx-auto grid max-w-[1280px] gap-10 px-5 sm:px-6 lg:grid-cols-2 lg:items-start lg:gap-16">
            <div>
              <h2 id="demo-heading" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                See readiness risk before it shows up in an audit
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white/75">
                Book a demo and we&apos;ll walk through how RiyadaIntel maps skills, compliance and certifications onto the teams that need action.
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white p-5 text-fg shadow-sm sm:p-6">
              <BookDemoForm />
            </div>
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
