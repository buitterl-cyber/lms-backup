import type { Metadata } from "next";
import Link from "next/link";
import { BookDemoForm } from "@/components/BookDemoForm";
import { LaunchPopup } from "@/components/LaunchPopup";
import { MarketingFooter } from "@/components/MarketingFooter";
import { MarketingHeader } from "@/components/MarketingHeader";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Security & Compliance — Riyada Intelligence",
  description: "How Riyada Intelligence protects workforce and compliance data — encryption, access control, data residency, and certification status.",
  alternates: { canonical: "/security" },
};

// Certification status is genuinely in-progress/planned, not yet complete — see each item's
// status. No dates or specifics are stated here that we can't stand behind; ask us directly for
// where things currently stand if that detail matters to your evaluation.
const CERTIFICATIONS = [
  {
    icon: "🔐",
    name: "SOC 2 Type II",
    status: "In progress",
    desc: "SOC 2 Type II audit in progress. We're happy to share our current security controls and audit timeline on request.",
  },
  {
    icon: "🇪🇺",
    name: "GDPR",
    status: "Aligned",
    desc: "Data subject rights, lawful basis for processing, and breach notification practices — see our Privacy Policy for the full detail.",
  },
  {
    icon: "🛡️",
    name: "ISO 27001",
    status: "Planned",
    desc: "ISO 27001 certification is on our roadmap. Ask us for details on our current information security practices and certification plans.",
  },
  {
    icon: "📍",
    name: "Data residency",
    status: "Region options planned",
    desc: "Data residency options (EU, UAE, and additional regions) are being finalized based on customer requirements. Talk to us about your specific residency needs.",
  },
] as const;

const PROTECTIONS = [
  {
    title: "Encryption",
    points: [
      "The site and API are served over HTTPS/TLS. We're closing a gap where a plain-HTTP request currently isn't force-redirected to HTTPS — tracked as an open item, not yet fixed.",
      "Account passwords are never stored in plain text — only as salted, one-way hashes.",
      "Encryption of data at rest depends on the underlying server/disk infrastructure rather than our own application-level encryption today — ask us for specifics if this matters for your evaluation.",
    ],
  },
  {
    title: "Access control",
    points: [
      "Role-based permissions (learner, manager, org admin, compliance manager, and more) gate every action server-side, not just hidden in the UI.",
      "Every request is scoped to a verified, signed session — there is no anonymous fallback that can expose another organisation's data.",
      "Multi-tenant data is isolated per-request at the application layer. Database-level row-security policies also exist in the schema as an intended second layer; we're still finishing the work to have every database connection enforce them, so treat that layer as in progress, not yet a live backstop.",
    ],
  },
  {
    title: "Data residency & hosting",
    points: [
      "Hosting region, backup frequency and retention details vary by deployment — talk to us and we'll walk you through what applies to your organisation.",
    ],
  },
  {
    title: "Third-party learning providers",
    points: [
      "When your organisation connects a content provider (GO1 today, with more added as we grow), we share only what's needed to enroll a learner and record their progress and course completion back into your dashboards — not broader profile or workforce data.",
      "Each connected provider processes that data under its own security and privacy terms — see our Privacy Policy for how this works.",
    ],
  },
] as const;

export default function SecurityPage() {
  return (
    <div className="mkt-page min-h-screen overflow-x-clip text-fg">
      <LaunchPopup />
      <MarketingHeader />

      <main>
        <section className="marketing-hero-wash relative overflow-hidden">
          <div className="relative mx-auto max-w-[880px] px-4 pb-8 pt-8 text-center sm:px-6 sm:pb-14 sm:pt-14">
            <div className="rise mkt-eyebrow mx-auto w-fit justify-center">
              <span className="mkt-eyebrow-label">
                <span aria-hidden>/</span> Security &amp; compliance
              </span>
            </div>
            <h1 className="rise rise-d1 font-display mt-5 text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-fg sm:mt-6 sm:text-5xl sm:leading-[1.08]">
              Built for regulated, audited environments.
            </h1>
            <p className="rise rise-d2 mx-auto mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-muted sm:mt-5 sm:text-lg">
              Riyada Intelligence handles workforce, skills and compliance data for regulated enterprises. Here&apos;s how we protect it, and where we honestly stand on formal certification today.
            </p>
          </div>

          <div className="relative border-t border-border/70 bg-card/40">
            <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                {CERTIFICATIONS.map((c, i) => (
                  <Reveal key={c.name} delayMs={i * 60} className="mkt-interactive rounded-md border border-dashed border-border bg-card p-4 transition-colors hover:border-accentOrange/50">
                    <div className="flex items-center gap-2">
                      <span aria-hidden className="text-lg">{c.icon}</span>
                      <p className="font-display text-sm font-semibold text-fg">{c.name}</p>
                    </div>
                    <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-accentOrange">{c.status}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{c.desc}</p>
                  </Reveal>
                ))}
              </div>
              <p className="mt-4 text-center text-[11px] text-muted">
                Certification status shown for illustration — ask us for our current security documentation.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border py-12 sm:py-16">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <Reveal className="max-w-2xl">
              <h2 className="font-display text-[1.5rem] font-semibold leading-tight tracking-tight text-fg sm:text-3xl">
                How we protect your data
              </h2>
            </Reveal>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5">
              {PROTECTIONS.map((p, i) => (
                <Reveal key={p.title} delayMs={i * 60} className="mkt-card-lift rounded-md border-t-2 border-b border-e border-s border-border bg-card p-5 sm:p-6">
                  <h3 className="font-display text-base font-semibold text-fg">{p.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                        <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accentOrange" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card/40 py-12 sm:py-16">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <Reveal className="rounded-md border border-border bg-card p-5 sm:p-8">
              <h2 className="font-display text-lg font-semibold text-fg sm:text-xl">Incident response &amp; disclosure</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                If you believe you&apos;ve found a security issue, email{" "}
                <a href="mailto:security@riyadaintel.com" className="text-brand hover:underline">security@riyadaintel.com</a>
                {" "}with details, or use the form below and mark it urgent. We don&apos;t yet have a published
                incident-response SLA; ask us directly for our current process.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                For the full detail on what we collect, how it&apos;s used, and your rights over it, see our{" "}
                <Link href="/privacy" className="text-brand hover:underline">Privacy Policy</Link> and{" "}
                <Link href="/terms" className="text-brand hover:underline">Terms of Service</Link>.
              </p>
            </Reveal>
          </div>
        </section>

        <section id="book-demo" className="relative overflow-hidden bg-brand py-12 text-white sm:py-16">
          <div className="relative z-10 mx-auto grid max-w-[1280px] gap-7 px-4 sm:px-6 lg:grid-cols-2 lg:items-start lg:gap-16">
            <Reveal>
              <h2 className="font-display text-[1.5rem] font-semibold leading-tight tracking-tight sm:text-3xl">
                Need our full security documentation for procurement?
              </h2>
              <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-white/75 sm:text-base">
                Tell us a bit about your organisation and we&apos;ll follow up with what your security or procurement team needs.
              </p>
              <ul className="mt-6 space-y-3 sm:mt-8">
                {[
                  "Tell us a bit about your organisation",
                  "We'll follow up with what your security or procurement team needs",
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
