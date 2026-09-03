import type { Metadata } from "next";
import Link from "next/link";
import { BookDemoForm } from "@/components/BookDemoForm";
import { LaunchPopup } from "@/components/LaunchPopup";
import { MarketingFooter } from "@/components/MarketingFooter";
import { MarketingHeader } from "@/components/MarketingHeader";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Pricing — Riyada Intelligence",
  description: "Enterprise pricing for Riyada Intelligence, built around your organisation's size, providers, and compliance requirements.",
  alternates: { canonical: "/pricing" },
};

// What's actually in the product today (skills graph, compliance/cert tracking, GO1 as the one
// connected provider, admin/reporting surfaces) — real capabilities, not aspirational claims. No
// specific pricing numbers anywhere on this page: see the constraint in the section-4 task —
// pricing isn't finalized, so this stays intentionally generic until it is.
const INCLUDED = [
  "Skills Graph, gap intelligence and workforce readiness scoring",
  "Compliance and certification tracking with expiry/renewal alerts",
  "Connected learning provider — GO1, with more providers added as you need them",
  "Admin, manager and compliance reporting surfaces",
  "Role-based access control for learner, manager and admin users",
  "Standard support during business hours",
] as const;

const FAQS = [
  {
    q: "How is pricing structured?",
    a: "Pricing is quoted per organisation, based on factors like the number of active users, which learning providers you connect, and your support and deployment requirements. Talk to sales below and we'll walk you through exactly how your quote is built.",
  },
  {
    q: "Is there a free trial or pilot?",
    a: "We work directly with each organisation to scope an evaluation where it makes sense. Talk to sales and we'll figure out what's right for your process.",
  },
  {
    q: "What's the billing cycle?",
    a: "Billing terms are agreed as part of your quote, based on your procurement process. Talk to sales for the specifics that would apply to you.",
  },
  {
    q: "Do you support custom contracts or procurement review?",
    a: "Yes — as an enterprise-focused platform, we expect to work through your procurement and security review process. See our Security & Compliance page, or contact sales below to start that conversation.",
  },
  {
    q: "Can we deploy with specific data residency requirements?",
    a: "Data residency needs vary by deployment — see our Security & Compliance page for what's available today, or talk to sales about your specific requirements.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="mkt-page min-h-screen overflow-x-clip text-fg">
      <LaunchPopup />
      <MarketingHeader />

      <main>
        <section className="marketing-hero-wash relative overflow-hidden">
          <div className="relative mx-auto max-w-[880px] px-4 pb-8 pt-8 text-center sm:px-6 sm:pb-14 sm:pt-14">
            <div className="rise mkt-eyebrow mx-auto w-fit justify-center">
              <span className="mkt-eyebrow-label">
                <span aria-hidden>/</span> Pricing
              </span>
            </div>
            <h1 className="rise rise-d1 font-display mt-5 text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-fg sm:mt-6 sm:text-5xl sm:leading-[1.08]">
              Enterprise pricing, built around your organisation.
            </h1>
            <p className="rise rise-d2 mx-auto mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-muted sm:mt-5 sm:text-lg">
              We work with regulated enterprises whose needs vary widely by headcount, provider mix, and compliance
              requirements — so pricing is quoted directly, not self-serve. Talk to us and we&apos;ll put together a
              plan that fits.
            </p>
            <div className="rise rise-d3 mt-6 flex flex-col items-center gap-2.5 sm:mt-8 sm:flex-row sm:justify-center sm:gap-3">
              <a href="#talk-to-sales" className="mkt-btn-demo inline-flex min-h-12 w-full items-center justify-center rounded-full px-7 text-sm font-semibold sm:w-auto">
                Talk to sales
              </a>
            </div>
          </div>
        </section>

        <section className="border-b border-border py-12 sm:py-16">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-[1.5rem] font-semibold leading-tight tracking-tight text-fg sm:text-3xl">
                What&apos;s included
              </h2>
              <p className="mt-2 text-sm text-muted sm:text-base">Every plan is quoted individually — this is the platform every quote is built from.</p>
            </Reveal>
            <Reveal delayMs={80} className="mx-auto mt-8 max-w-2xl rounded-md border border-border bg-card p-5 sm:mt-10 sm:p-8">
              <ul className="space-y-3">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-fg sm:text-base">
                    <span aria-hidden className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accentOrange/15 text-[11px] text-accentOrange">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="border-b border-border bg-card/40 py-12 sm:py-16">
          <div className="mx-auto max-w-[820px] px-4 sm:px-6">
            <Reveal>
              <h2 className="font-display text-[1.5rem] font-semibold leading-tight tracking-tight text-fg sm:text-3xl">
                Common questions
              </h2>
            </Reveal>
            <div className="mt-8 space-y-4 sm:mt-10">
              {FAQS.map((f, i) => (
                <Reveal key={f.q} delayMs={i * 50} className="mkt-interactive rounded-md border border-border bg-card p-5 transition-colors hover:border-brand/30">
                  <p className="font-display text-sm font-semibold text-fg sm:text-base">{f.q}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
                </Reveal>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-muted">
              Want the security detail behind some of these answers? See{" "}
              <Link href="/security" className="text-brand hover:underline">Security &amp; Compliance</Link>.
            </p>
          </div>
        </section>

        <section id="talk-to-sales" className="relative scroll-mt-24 overflow-hidden bg-brand py-12 text-white sm:py-16">
          <div className="relative z-10 mx-auto grid max-w-[1280px] gap-7 px-4 sm:px-6 lg:grid-cols-2 lg:items-start lg:gap-16">
            <Reveal>
              <h2 className="font-display text-[1.5rem] font-semibold leading-tight tracking-tight sm:text-3xl">
                Talk to sales
              </h2>
              <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-white/75 sm:text-base">
                Tell us about your organisation — size, providers you use today, and compliance requirements — and
                we&apos;ll put together a plan and walk you through it.
              </p>
              <ul className="mt-6 space-y-3 sm:mt-8">
                {[
                  "Tell us about your organisation — size, providers, compliance needs",
                  "We'll put together a plan and walk you through pricing",
                  "No commitment to start the conversation",
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
