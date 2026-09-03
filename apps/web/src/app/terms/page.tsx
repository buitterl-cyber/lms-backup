import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — Riyada Intelligence",
  description: "The terms that govern use of the Riyada Intelligence platform.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "4 August 2026";

const SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    body: (
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern access to and use of the Riyada Intelligence workforce
        readiness platform (the &ldquo;Service&rdquo;), provided by <strong>[Company legal name]</strong>{" "}
        (&ldquo;Riyada Intelligence&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account, or by using the
        Service on behalf of an organisation, you agree to these Terms. If you&apos;re accepting on behalf of a
        company or other legal entity, you confirm you have authority to bind that entity, in which case
        &ldquo;you&rdquo; refers to that entity.
      </p>
    ),
  },
  {
    id: "the-service",
    title: "The Service",
    body: (
      <p>
        Riyada Intelligence connects workforce, skills, compliance and certification data with learning content from
        connected providers (currently GO1, and any additional provider your organisation enables as we add support
        for it) to surface skills gaps, readiness scores, and recommended training actions.
        We may add, change, or remove features over time as the product evolves.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Accounts and account responsibilities",
    body: (
      <ul>
        <li>You must provide accurate registration information and keep it up to date.</li>
        <li>You&apos;re responsible for safeguarding your login credentials and for all activity under your account. Tell us immediately if you suspect unauthorised access.</li>
        <li>Accounts are for use by the individual (or, for admin/service accounts, the organisation) they were created for — don&apos;t share credentials or transfer an account without our consent.</li>
        <li>Organisation administrators are responsible for managing the accounts, roles and data access they grant within their organisation&apos;s workspace.</li>
      </ul>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>When using the Service, you agree not to:</p>
        <ul>
          <li>Use it for any unlawful purpose, or in a way that infringes anyone else&apos;s rights;</li>
          <li>Attempt to gain unauthorised access to the Service, other accounts, or connected systems;</li>
          <li>Reverse-engineer, decompile, or attempt to extract the source code of the Service, except where the law gives you that right despite this restriction;</li>
          <li>Scrape, crawl, or use automated means to access the Service beyond what we provide via supported interfaces;</li>
          <li>Upload or transmit malicious code, or interfere with the Service&apos;s normal operation or other users&apos; use of it;</li>
          <li>Use connected third-party provider content (GO1, or any other provider your organisation connects) in a way that breaches that provider&apos;s own terms of use.</li>
        </ul>
      </>
    ),
  },
  {
    id: "third-party-providers",
    title: "Third-party learning providers",
    body: (
      <p>
        The Service can connect to third-party learning content providers your organisation chooses to enable.
        Course content, availability, and completion data from those providers is owned and controlled by the
        respective provider and subject to that provider&apos;s own terms and privacy policy, not these Terms.
        Riyada Intelligence is not responsible for the availability, accuracy, or content of third-party provider
        material, and a provider connection may change or be discontinued if the provider changes its API, terms,
        or availability.
      </p>
    ),
  },
  {
    id: "subscriptions-billing",
    title: "Subscriptions and billing",
    body: (
      <>
        <p>
          <strong>
            This section is a placeholder. Riyada Intelligence does not have finalized pricing, billing cycles, or
            payment terms at this time — the language below is generic and must be replaced with real commercial
            terms before it&apos;s relied on.
          </strong>
        </p>
        <ul>
          <li>Access to paid features of the Service is provided under a subscription, billed on a [monthly/annual — to be confirmed] cycle, at the pricing set out in your order form or the pricing page in effect at the time.</li>
          <li>[Confirm trial terms, if any — e.g. length of free trial and what happens at the end of it.]</li>
          <li>Fees are non-refundable except as required by law or as otherwise stated in your order form. [Confirm refund policy.]</li>
          <li>We may suspend or limit access to the Service for accounts with overdue payment, after reasonable notice. [Confirm notice period and grace period.]</li>
          <li>[Confirm renewal terms — e.g. whether subscriptions auto-renew, and the notice period for either party to opt out of renewal.]</li>
        </ul>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: (
      <>
        <p>
          Riyada Intelligence and its licensors own all rights, title and interest in the Service, including its software,
          design, and branding. These Terms don&apos;t grant you any ownership rights in the Service — only a
          limited, non-exclusive, non-transferable right to use it in line with these Terms.
        </p>
        <p>
          You (or your organisation) retain ownership of the data you put into the Service (e.g. your workforce,
          skills and compliance data). You grant us a licence to host, process and display that data solely to
          provide the Service to you.
        </p>
      </>
    ),
  },
  {
    id: "confidentiality",
    title: "Confidentiality",
    body: (
      <p>
        Each party may access confidential information belonging to the other in connection with the Service. Both
        parties agree to protect the other&apos;s confidential information with reasonable care and to use it only
        for the purposes of the Service, except where disclosure is required by law.
      </p>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the extent permitted by law,
        we disclaim all warranties, express or implied, including any warranty of merchantability, fitness for a
        particular purpose, or non-infringement. We don&apos;t guarantee that the Service will be uninterrupted,
        error-free, or that skills/readiness recommendations will be complete or suitable for every use case —
        they&apos;re a decision-support tool, not a substitute for your own judgement or compliance obligations.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the maximum extent permitted by law, Riyada Intelligence will not be liable for any indirect, incidental,
        special, consequential, or punitive damages, or any loss of profits, revenue, data, or goodwill, arising
        from your use of the Service. Our total liability arising out of or relating to the Service will not
        exceed [the amount you paid us in the 12 months before the claim — to be confirmed once pricing terms are
        finalized]. Nothing in these Terms limits liability that can&apos;t be limited under applicable law (for
        example, liability for death or personal injury caused by negligence, or fraud).
      </p>
    ),
  },
  {
    id: "indemnification",
    title: "Indemnification",
    body: (
      <p>
        You agree to indemnify and hold Riyada Intelligence harmless from any claims, damages, or expenses (including
        reasonable legal fees) arising from your breach of these Terms or misuse of the Service, except to the
        extent caused by our own breach or negligence.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    body: (
      <ul>
        <li>You may stop using the Service, and an organisation administrator may close the organisation&apos;s account, at any time. [Confirm any notice period tied to subscription terms once finalized.]</li>
        <li>We may suspend or terminate access if you breach these Terms, misuse the Service, or (subject to the billing section above) don&apos;t pay fees when due.</li>
        <li>On termination, your right to use the Service ends. We&apos;ll provide a reasonable window to export your organisation&apos;s data before deletion [confirm export window, e.g. 30 days], except where we&apos;re required to retain it for longer by law.</li>
      </ul>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law and disputes",
    body: (
      <p>
        These Terms are governed by the laws of <strong>[Governing jurisdiction to be confirmed]</strong>, without
        regard to conflict-of-law principles. Any dispute arising from these Terms or the Service will be subject
        to the exclusive jurisdiction of the courts of <strong>[Governing jurisdiction to be confirmed]</strong>,
        unless applicable consumer-protection or employment law gives you the right to bring a claim elsewhere.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these Terms",
    body: (
      <p>
        We may update these Terms from time to time, for example as the product or our legal obligations change.
        We&apos;ll update the &ldquo;Last updated&rdquo; date above when we do, and for material changes we&apos;ll
        take reasonable steps to notify account administrators [confirm notice period, e.g. 30 days before
        material changes take effect]. Continued use of the Service after changes take effect means you accept
        the updated Terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <p>
        Questions about these Terms can be sent to <strong>[Legal/Support contact email]</strong> or by post to{" "}
        <strong>[Company registered address]</strong>.
      </p>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated={UPDATED}
      intro={
        <p>
          These Terms are a first-pass draft. Sections in <strong>[brackets]</strong> — most notably subscriptions
          &amp; billing and the liability cap — are placeholders that need real commercial and legal input before
          this page should be relied upon.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
