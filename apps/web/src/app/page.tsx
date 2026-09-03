import { BookDemoForm } from "@/components/BookDemoForm";
import { HeroProductVisual } from "@/components/HeroProductVisual";
import { LaunchPopup } from "@/components/LaunchPopup";
import { MarketingFooter } from "@/components/MarketingFooter";
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

// Only GO1 is a confirmed, active provider relationship today — don't list others here as if
// they're already connected. The "works with your stack" positioning is still true of the
// architecture and stays in the surrounding copy; this list is just the current, honest state.
const ACTIVE_PROVIDERS = ["GO1"] as const;

// Placeholder trust-bar badges — see the comment above the trust bar in the hero. Real status
// (or removal of any badge we don't end up pursuing) needs to come from whoever owns security/compliance.
const TRUST_BADGES = [
  { icon: "🔐", label: "SOC 2 Type II", status: "in progress" },
  { icon: "🇪🇺", label: "GDPR", status: "aligned" },
  { icon: "📍", label: "Data residency", status: "region options planned" },
  { icon: "🛡️", label: "ISO 27001", status: "planned" },
] as const;

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
    <div className="mkt-page min-h-screen overflow-x-clip text-fg">
      <LaunchPopup />
      <MarketingHeader />

      <main>
        {/* —— Hero —— */}
        <section className="marketing-hero-wash relative overflow-hidden" aria-labelledby="hero-heading">
          <div className="relative mx-auto grid max-w-[1280px] items-center gap-6 px-4 pb-6 pt-4 sm:gap-10 sm:px-6 sm:pb-14 sm:pt-8 lg:grid-cols-[44%_56%] lg:gap-12 lg:pb-16 lg:pt-10">
            <div className="relative">
              {/*
                Ambient hero video (Excis-style) — capability is wired up but NOT enabled: there is
                no footage at /videos/marketing/hero-ambient.mp4 yet, and rendering a <video> with a
                missing source would show a broken element to real visitors on this live site. Once
                real footage is supplied, uncomment the block below (and delete this comment).

                Footage spec:
                - Silent (no audio track needed — `muted` is required for autoplay anyway).
                - Slow, low-contrast, ambient motion — people/office footage in soft, slow-moving
                  motion (walking, typing, quiet collaboration), NOT a fast highlight reel; nothing
                  in the frame should compete with the headline for attention.
                - Colour-grade it with the same recipe already used for every other marketing photo
                  this session (`-modulate 100,80,100 -fill "#14264a" -colorize 13%`) so it matches
                  the how-it-works/integrations tone rather than introducing a new look.
                - Loop point should be seamless (first/last frame close enough that the cut isn't
                  visible) since `loop` just restarts instantly with no crossfade.
                - Encode as .mp4 (H.264) + .webm, short (6-12s), heavily compressed (target well
                  under 1.5MB — this sits behind an above-the-fold headline, not a hero banner) and
                  supply a static poster/first-frame .webp for `poster=` so there's no flash of
                  empty space before it loads.
                - Provide it at 1600px wide (matches the other hero-width marketing assets) as
                  /videos/marketing/hero-ambient.mp4 (+.webm) and a poster at
                  /images/marketing/hero-ambient-poster.webp.

                <div className="mkt-hero-video" aria-hidden>
                  <video autoPlay loop muted playsInline preload="none" poster="/images/marketing/hero-ambient-poster.webp">
                    <source src="/videos/marketing/hero-ambient.webm" type="video/webm" />
                    <source src="/videos/marketing/hero-ambient.mp4" type="video/mp4" />
                  </video>
                </div>
              */}
              <div className="rise mkt-eyebrow">
                <span className="mkt-eyebrow-label">
                  <span aria-hidden>/</span>
                  <span className="sm:hidden">For regulated enterprise</span>
                  <span className="hidden sm:inline">For regulated enterprise — FinTech, MedTech &amp; compliance-heavy industries</span>
                </span>
                <span className="mkt-eyebrow-tag hidden sm:inline">№ 01 — Overview</span>
              </div>
              <h1
                id="hero-heading"
                className="rise rise-d1 font-display mt-5 text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-fg sm:mt-6 sm:text-5xl sm:leading-[1.08] lg:text-[3.15rem] lg:leading-[1.05]"
              >
                See every skill and compliance gap{" "}
                <span className="mkt-accent-line">before it becomes a risk.</span>
              </h1>
              <p className="rise rise-d2 mt-3 max-w-xl text-[0.95rem] leading-relaxed text-muted sm:mt-5 sm:text-lg">
                Riyada Intelligence gives regulated enterprises one live view of workforce readiness, certification status and audit risk — built for FinTech, MedTech, and other compliance-heavy teams, and powered by the learning providers you already use.
              </p>
              <div className="rise rise-d3 mt-5 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:items-center sm:gap-4">
                <a href="#book-demo" className="mkt-btn-demo inline-flex min-h-12 w-full items-center justify-center rounded-full px-7 text-sm font-semibold sm:w-auto">
                  Book a demo
                </a>
                <a
                  href="#how-it-works"
                  className="mkt-interactive inline-flex min-h-12 w-full items-center justify-center gap-1.5 text-sm font-semibold text-fg underline-offset-4 hover:text-brand hover:underline sm:w-auto"
                >
                  See how it works
                  <span aria-hidden className="inline-block text-accentOrange rtl:-scale-x-100">→</span>
                </a>
              </div>
            </div>
            <div className="rise rise-d4 lg:ps-2">
              <HeroProductVisual />
            </div>
          </div>

          {/* Trust bar — regulated buyers look for this before they'll even consider a demo, so it
              sits directly under the hero, not buried on a separate page. Every item here is a
              placeholder (dashed outline, explicit "in progress"/"planned" language, no logos with
              invented company names) until real certification status and named customers exist —
              see /security for the fuller, still-placeholder-flagged version of this. */}
          <div className="relative border-t border-border/70 bg-card/40">
            <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 sm:py-6">
              <p className="mkt-center-mobile text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted sm:text-start sm:text-[11px]">
                Security &amp; compliance posture
              </p>
              <ul className="mt-3 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start sm:gap-3">
                {TRUST_BADGES.map((b) => (
                  <li
                    key={b.label}
                    className="flex items-center gap-2 rounded-full border border-dashed border-border px-3.5 py-2 text-xs text-muted"
                    title="Placeholder — confirm real certification status before relying on this"
                  >
                    <span aria-hidden className="text-sm">{b.icon}</span>
                    <span className="font-medium text-fg/80">{b.label}</span>
                    <span className="text-[10px] text-muted">· {b.status}</span>
                  </li>
                ))}
              </ul>
              <p className="mkt-center-mobile mt-3 text-center text-[11px] text-muted sm:text-start">
                Certification status shown for illustration — ask us for our current security documentation.
              </p>
            </div>
          </div>

          {/* Proof */}
          <div id="customers" className="relative scroll-mt-24">
            <div className="mx-auto max-w-[1280px] px-4 pb-4 sm:px-6">
              <Reveal className="rounded-md border border-border/80 bg-card/80 p-5 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.25)] sm:p-8">
                <p className="max-w-3xl text-[0.95rem] font-medium leading-snug text-fg sm:text-lg">
                  Built for learning, compliance and workforce teams operating across complex, regulated organisations.
                </p>
                <ul className="mt-5 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-6">
                  {OUTCOMES.map((item, i) => (
                    <li
                      key={item.title}
                      className={`mkt-card-lift group flex gap-3 rounded-md border-t-2 border-b border-e border-s border-border bg-bg/60 p-3.5 sm:block sm:p-4 ${
                        i === 0 ? "border-t-border" : i === 1 ? "border-t-accentOrange" : "border-t-brandGold"
                      }`}
                    >
                      <p className="font-display shrink-0 text-xs font-semibold tracking-wider text-accentOrange sm:mb-2">
                        {String(i + 1).padStart(2, "0")}
                      </p>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-fg">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted sm:mt-1.5">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <span aria-hidden className="mkt-accent-rule mt-6 sm:mt-8" />
              </Reveal>
            </div>
          </div>
        </section>

        {/* Capability marquee */}
        <div className="mkt-marquee relative overflow-hidden border-y border-border bg-card/50 py-3.5" aria-hidden>
          <div className="mkt-marquee-track">
            {[...MARQUEE, ...MARQUEE].map((item, i) => (
              <span key={`${item}-${i}`} className="flex shrink-0 items-center gap-8 px-4">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{item}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-accentOrange/70" />
              </span>
            ))}
          </div>
        </div>

        {/* —— Intelligence layer —— */}
        <section id="product" className="mkt-mesh relative scroll-mt-24 overflow-hidden py-12 text-white sm:py-20" aria-labelledby="moat-heading">
          <div className="mkt-band-product-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/marketing/product-1920.webp"
              srcSet="/images/marketing/product-960.webp 960w, /images/marketing/product-1920.webp 1920w"
              sizes="100vw"
              width={1920}
              height={1280}
              alt="Executive presenting annual business report data on a large screen to a seated team"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6">
            <Reveal className="mkt-eyebrow on-dark">
              <span className="mkt-eyebrow-label">
                <span aria-hidden>/</span> Product
              </span>
              <span className="mkt-eyebrow-tag">№ 02 — The intelligence layer</span>
            </Reveal>
            <Reveal className="mt-7 max-w-3xl sm:mt-8">
              <h2 id="moat-heading" className="font-display text-[1.65rem] font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
                The content is not the moat.
                <span className="mt-1.5 block text-accentOrange sm:mt-2">The intelligence layer is.</span>
              </h2>
              <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-white/70 sm:mt-5 sm:text-lg">
                Training content is widely available. The advantage comes from knowing which capabilities matter, where the gaps are, and what action each team should take next.
              </p>
            </Reveal>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-2 lg:gap-5">
              <Reveal className="rounded-md border border-white/10 bg-white/[0.04] p-5 sm:p-7">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 sm:text-sm">Course aggregation</h3>
                <ul className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
                  {AGGREGATION.map((line) => (
                    <li key={line} className="flex gap-3 text-sm text-white/65">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/35" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delayMs={80} className="rounded-md border border-accentOrange/45 bg-accentOrange/10 p-5 shadow-[0_0_40px_-12px_rgba(245,166,35,0.35)] sm:p-7">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-accentOrange sm:text-sm">Riyada Intelligence</h3>
                <ul className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
                  {INTELLIGENCE.map((line) => (
                    <li key={line} className="flex gap-3 text-sm text-white">
                      <span className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accentOrange/25 text-[10px] text-accentOrange" aria-hidden>
                        ✓
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <div id="solutions" className="mt-8 grid scroll-mt-24 grid-cols-1 gap-3 sm:mt-14 sm:gap-4 md:grid-cols-3 md:gap-5">
              {CAPABILITIES.map((cap, i) => (
                <Reveal
                  key={cap.title}
                  delayMs={i * 70}
                  className={`mkt-card-lift group rounded-md border-t-2 border-b border-e border-s border-white/10 bg-white/[0.05] p-5 hover:border-accentOrange/40 hover:bg-white/[0.08] sm:p-6 ${
                    i === 0 ? "border-t-white/10" : i === 1 ? "border-t-accentOrange" : "border-t-brandGold"
                  }`}
                >
                  <p className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-accentOrange">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-white sm:mt-3 sm:text-lg">{cap.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/65 sm:mt-2">{cap.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* —— Workflow —— */}
        <section id="how-it-works" className="mkt-band-workflow relative scroll-mt-24 overflow-hidden border-b border-border py-12 sm:py-20" aria-labelledby="workflow-heading">
          <div className="mkt-band-workflow-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="mkt-band-workflow-photo-a"
              src="/images/marketing/workflow-presentation-1920.webp"
              srcSet="/images/marketing/workflow-presentation-960.webp 960w, /images/marketing/workflow-presentation-1920.webp 1920w"
              sizes="(min-width: 1024px) 50vw, 100vw"
              width={1920}
              height={1280}
              alt="Presenter speaking to a seated audience during a business workforce readiness briefing"
              loading="lazy"
              decoding="async"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="mkt-band-workflow-photo-b"
              src="/images/marketing/teacher-1600.webp"
              srcSet="/images/marketing/teacher-800.webp 800w, /images/marketing/teacher-1600.webp 1600w"
              sizes="50vw"
              width={1600}
              height={1067}
              alt="Teacher who uses a wheelchair speaking with a microphone to a seated classroom audience"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6">
            <Reveal className="mkt-eyebrow on-dark">
              <span className="mkt-eyebrow-label">
                <span aria-hidden>/</span> Workflow
              </span>
              <span className="mkt-eyebrow-tag">№ 03 — How it works</span>
            </Reveal>
            <Reveal className="mt-7 max-w-2xl sm:mt-8">
              <h2 id="workflow-heading" className="font-display text-[1.65rem] font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                From signal to action in one workflow
              </h2>
              <p className="mt-2 text-sm text-white/75 sm:mt-3 sm:text-base">
                A focused path from connected data to prioritised interventions — without turning the homepage into a catalogue.
              </p>
            </Reveal>
            <ol className="mt-7 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {WORKFLOW.map((item, i) => (
                <Reveal
                  key={item.step}
                  delayMs={i * 60}
                  as="li"
                  className="mkt-card-lift group flex gap-3 rounded-md border border-border bg-card p-4 shadow-sm sm:block sm:p-5"
                >
                  <p className="font-display shrink-0 text-xs font-semibold tracking-wider text-accentOrange">{item.step}</p>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-fg sm:mt-2 sm:text-base">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted sm:mt-2">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* —— Integrations —— */}
        <section id="integrations" className="scroll-mt-24 border-b border-border" aria-labelledby="integrations-heading">
          <div className="relative overflow-hidden py-12 sm:py-20">
            <div className="mkt-band-integrations-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="mkt-band-integrations-photo-a"
                src="/images/marketing/team-collab-1600.webp"
                srcSet="/images/marketing/team-collab-900.webp 900w, /images/marketing/team-collab-1600.webp 1600w"
                sizes="40vw"
                width={1600}
                height={1065}
                alt="Smiling team member collaborating with colleagues at his desk in a modern office"
                loading="lazy"
                decoding="async"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="mkt-band-integrations-photo-b"
                src="/images/marketing/team-video-1920.webp"
                srcSet="/images/marketing/team-video-960.webp 960w, /images/marketing/team-video-1920.webp 1920w"
                sizes="100vw"
                width={1600}
                height={1142}
                alt="Colleagues in a meeting room joined by remote teammates on a video call screen showing four participants"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6">
              <Reveal className="mkt-eyebrow on-dark">
                <span className="mkt-eyebrow-label">
                  <span aria-hidden>/</span> Integrations
                </span>
                <span className="mkt-eyebrow-tag">№ 04 — Works with your stack</span>
              </Reveal>
              <Reveal className="mt-7 max-w-3xl sm:mt-8">
                <h2 id="integrations-heading" className="font-display text-[1.65rem] font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                  Works with the providers you already use
                </h2>
                <p className="mt-2 text-sm text-white/75 sm:mt-3 sm:text-base">
                  Riyada Intelligence sits above your learning stack. Act on gaps without ripping out content sources.
                </p>
              </Reveal>
            </div>
          </div>
          <div className="mkt-band-integrations py-8 sm:py-10">
            <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted sm:text-sm">Connected today</p>
              <ul className="mt-3 flex flex-wrap gap-2 sm:gap-3">
                {ACTIVE_PROVIDERS.map((p, i) => (
                  <Reveal
                    key={p}
                    as="li"
                    delayMs={i * 50}
                    className="mkt-interactive rounded-full border border-border bg-card/90 px-3.5 py-2 text-xs font-medium text-fg shadow-sm hover:-translate-y-0.5 hover:border-accentOrange/40 hover:shadow-md sm:px-5 sm:py-2.5 sm:text-sm"
                  >
                    {p}
                  </Reveal>
                ))}
              </ul>
              <p className="mt-5 text-xs text-muted sm:mt-6 sm:text-sm">
                Built to connect to the providers you already use — more connectors are added as customer deployments need them.
              </p>
            </div>
          </div>
        </section>

        {/* —— Final CTA —— */}
        <section id="book-demo" className="relative scroll-mt-24 overflow-hidden bg-brand py-12 text-white sm:py-20" aria-labelledby="demo-heading">
          <div aria-hidden className="mkt-band-cta-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/marketing/demo-meeting2-1600.webp"
              srcSet="/images/marketing/demo-meeting2-800.webp 800w, /images/marketing/demo-meeting2-1600.webp 1600w"
              sizes="100vw"
              width={1600}
              height={1234}
              alt="Video call screen showing four smiling remote colleagues, with a hand holding a pen in the foreground"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div aria-hidden className="marketing-cta-wash pointer-events-none absolute inset-0" />
          <div className="relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6">
            <div aria-hidden className="mkt-band-cta-photo-top">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/marketing/demo-meeting2-1600.webp"
                srcSet="/images/marketing/demo-meeting2-800.webp 800w, /images/marketing/demo-meeting2-1600.webp 1600w"
                sizes="100vw"
                width={1600}
                height={1234}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
          <div className="relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6">
            <Reveal className="mkt-eyebrow on-dark">
              <span className="mkt-eyebrow-label">
                <span aria-hidden>/</span> Book a demo
              </span>
              <span className="mkt-eyebrow-tag">№ 05 — Contact</span>
            </Reveal>
          </div>
          <div className="relative z-10 mx-auto grid max-w-[1280px] gap-7 px-4 pt-7 sm:gap-10 sm:px-6 sm:pt-8 lg:grid-cols-2 lg:items-start lg:gap-16">
            <Reveal>
              <h2 id="demo-heading" className="font-display text-[1.65rem] font-semibold leading-tight tracking-tight sm:text-4xl">
                See readiness risk before it shows up in an audit
              </h2>
              <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-white/75 sm:mt-4 sm:text-base">
                Book a demo and we&apos;ll walk through how Riyada Intelligence maps skills, compliance and certifications onto the teams that need action.
              </p>
              <ul className="mt-6 space-y-3 sm:mt-8">
                {[
                  "Tell us a bit about your team and what you're trying to solve",
                  "We'll walk through Riyada Intelligence live, mapped to your own data",
                  "No commitment — just a clear look at what it would show you",
                ].map((line) => (
                  <li key={line} className="flex gap-3 text-sm leading-relaxed text-white/70">
                    <span aria-hidden className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] text-white">✓</span>
                    {line}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delayMs={80} className="rounded-md border border-white/20 bg-white p-4 text-fg shadow-2xl shadow-black/25 sm:p-6">
              <BookDemoForm />
            </Reveal>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
