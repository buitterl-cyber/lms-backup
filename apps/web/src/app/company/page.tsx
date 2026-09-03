import type { Metadata } from "next";
import Link from "next/link";
import { BookDemoForm } from "@/components/BookDemoForm";
import { LaunchPopup } from "@/components/LaunchPopup";
import { MarketingFooter } from "@/components/MarketingFooter";
import { MarketingHeader } from "@/components/MarketingHeader";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Company — Riyada Intelligence",
  description: "Who Riyada Intelligence is, and why we build workforce compliance intelligence for regulated enterprise.",
  alternates: { canonical: "/company" },
};

export default function CompanyPage() {
  return (
    <div className="mkt-page min-h-screen overflow-x-clip text-fg">
      <LaunchPopup />
      <MarketingHeader />

      <main>
        <section className="marketing-hero-wash relative overflow-hidden">
          <div className="relative mx-auto max-w-[880px] px-4 pb-8 pt-8 text-center sm:px-6 sm:pb-14 sm:pt-14">
            <div className="rise mkt-eyebrow mx-auto w-fit justify-center">
              <span className="mkt-eyebrow-label">
                <span aria-hidden>/</span> Company
              </span>
            </div>
            <h1 className="rise rise-d1 font-display mt-5 text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-fg sm:mt-6 sm:text-5xl sm:leading-[1.08]">
              We build the intelligence layer regulated teams have been missing.
            </h1>
            <p className="rise rise-d2 mx-auto mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-muted sm:mt-5 sm:text-lg">
              Learning content is everywhere. Knowing exactly who&apos;s compliant, who isn&apos;t, and what to fix before an audit finds it — that&apos;s the harder problem, and it&apos;s the one we work on.
            </p>
          </div>
        </section>

        <section className="border-b border-border py-12 sm:py-16">
          <div className="mx-auto max-w-[880px] px-4 sm:px-6">
            <Reveal>
              <h2 className="font-display text-lg font-semibold text-fg sm:text-xl">What we do</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                Riyada Intelligence connects workforce, skills, certification and compliance data with the learning
                providers regulated teams use — starting with GO1, with more providers added as we grow — into a
                single view of readiness and risk. We&apos;re built for FinTech, MedTech, and other
                compliance-heavy industries where &ldquo;someone probably completed that training&rdquo; isn&apos;t good enough.
              </p>
            </Reveal>
            <Reveal delayMs={60} className="mt-8">
              <h2 className="font-display text-lg font-semibold text-fg sm:text-xl">Who we are</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                We&apos;re a focused team building the workforce intelligence layer regulated enterprises have
                been missing — reach out below if you&apos;d like to know more about who&apos;s behind Riyada
                Intelligence.
              </p>
            </Reveal>
            <Reveal delayMs={120} className="mt-8">
              <h2 className="font-display text-lg font-semibold text-fg sm:text-xl">Careers</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                We&apos;re not actively hiring right now. If you&apos;re interested in future opportunities, use
                the contact form below and we&apos;ll keep you in mind.
              </p>
            </Reveal>
            <Reveal delayMs={180} className="mt-8">
              <h2 className="font-display text-lg font-semibold text-fg sm:text-xl">Get in touch</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                General enquiries: use the contact form below
                <br />
                Security &amp; compliance: see our <Link href="/security" className="text-brand hover:underline">Security &amp; Compliance</Link> page
                <br />
                Legal: see our <Link href="/privacy" className="text-brand hover:underline">Privacy Policy</Link> and{" "}
                <Link href="/terms" className="text-brand hover:underline">Terms of Service</Link>
              </p>
            </Reveal>
          </div>
        </section>

        <section id="book-demo" className="relative overflow-hidden bg-brand py-12 text-white sm:py-16">
          <div className="relative z-10 mx-auto grid max-w-[1280px] gap-7 px-4 sm:px-6 lg:grid-cols-2 lg:items-start lg:gap-16">
            <Reveal>
              <h2 className="font-display text-[1.5rem] font-semibold leading-tight tracking-tight sm:text-3xl">
                Want to see it on your own workforce data?
              </h2>
              <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-white/75 sm:text-base">
                Book a demo and we&apos;ll walk through how Riyada Intelligence maps to your compliance requirements.
              </p>
              <ul className="mt-6 space-y-3 sm:mt-8">
                {[
                  "Tell us about your team and workforce data",
                  "We'll walk through Riyada Intelligence live",
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
