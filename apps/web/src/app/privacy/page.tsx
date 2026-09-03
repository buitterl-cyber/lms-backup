import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Riyada Intelligence",
  description: "How Riyada Intelligence collects, uses and protects personal data.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "4 August 2026";

const SECTIONS: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          Riyada Intelligence (&ldquo;Riyada Intelligence&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) provides a workforce-readiness
          intelligence platform for learning, compliance and skills teams. This policy explains what personal
          data we collect through our website and product, why we collect it, who we share it with, and the
          rights you have over it.
        </p>
        <p>
          For the purposes of applicable data protection law (including the EU/UK GDPR), the data controller is:
        </p>
        <p>
          <strong>[Company legal name]</strong>
          <br />
          [Company registered address]
          <br />
          Company registration number: [Company registration number]
          <br />
          Privacy contact: [Privacy/Data Protection contact email]
        </p>
      </>
    ),
  },
  {
    id: "data-we-collect",
    title: "What data we collect",
    body: (
      <>
        <p>We collect different data depending on how you interact with us:</p>
        <ul>
          <li>
            <strong>Demo requests (&ldquo;Book a demo&rdquo; form):</strong> full name, work email address,
            company name, and any message you choose to add.
          </li>
          <li>
            <strong>Launch promotion form (&ldquo;25% off our official launch&rdquo; pop-up):</strong> full
            name, company name, email address, and phone number (with country code).
          </li>
          <li>
            <strong>Learner and admin accounts:</strong> name, work email, job title, department, role/permission
            level, password (stored as a salted hash, never in plain text), and platform activity such as course
            enrollments, progress, completions, assessment results, certifications, skills data and gamification
            data (XP, streaks, badges).
          </li>
          <li>
            <strong>Automatically collected data:</strong> IP address, browser and device information, and basic
            usage/log data needed to operate and secure the platform (e.g. login timestamps, error logs).
          </li>
          <li>
            <strong>Cookies:</strong> we use a strictly necessary session cookie to keep you signed in. We do not
            currently set non-essential analytics or marketing cookies. [If/when analytics, advertising, or
            other non-essential cookies are added, list each tool here (e.g. Google Analytics) and add a cookie
            consent banner for EU/UK visitors before they are set.]
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use your data",
    body: (
      <ul>
        <li>To respond to demo requests and sales enquiries, and to follow up with relevant offers.</li>
        <li>To create and administer learner and admin accounts, and to operate the platform&apos;s core features (catalog, enrollment, progress tracking, certifications, reporting).</li>
        <li>To communicate with you about your account, service updates, and (where you&apos;ve agreed to be contacted) product or promotional updates.</li>
        <li>To maintain the security, integrity and performance of the platform, including detecting and preventing fraud or misuse.</li>
        <li>To comply with our legal obligations, and to establish, exercise or defend legal claims.</li>
      </ul>
    ),
  },
  {
    id: "legal-basis",
    title: "Our legal basis for processing (GDPR)",
    body: (
      <p>
        Where the GDPR applies, we rely on: <strong>contract</strong> (to provide the platform to accounts we
        administer on your organisation&apos;s behalf), <strong>legitimate interests</strong> (to respond to
        enquiries, keep the platform secure, and improve our product), <strong>consent</strong> (for any optional
        marketing communications or non-essential cookies, which you can withdraw at any time), and{" "}
        <strong>legal obligation</strong> (where we must retain or disclose data to comply with the law).
      </p>
    ),
  },
  {
    id: "sharing",
    title: "Who we share data with",
    body: (
      <>
        <p>We do not sell personal data. We share it only in the following circumstances:</p>
        <ul>
          <li>
            <strong>Connected learning providers:</strong> if your organisation connects a third-party provider
            (currently GO1; we&apos;ll update this list as we connect additional providers) and you enroll in or
            complete a course through it, we share the minimum data needed to do so — typically your name, work email, and
            enrollment/completion status — with that provider, so they can grant you access and report progress
            back to us. Each provider processes that data under its own privacy policy and terms; we encourage
            you to review them.
          </li>
          <li>
            <strong>Service providers (sub-processors):</strong> companies that host our infrastructure, send
            transactional email, or otherwise support the operation of the platform, under contracts that
            require them to protect your data. [List sub-processors here, e.g. hosting provider, email delivery
            provider, once finalized.]
          </li>
          <li>
            <strong>Legal and safety reasons:</strong> where required to comply with the law, a valid legal
            process, or to protect the rights, property or safety of Riyada Intelligence, our users, or others.
          </li>
          <li>
            <strong>Business transfers:</strong> if Riyada Intelligence is involved in a merger, acquisition, or sale of
            assets, personal data may be transferred as part of that transaction, subject to this policy.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "international-transfers",
    title: "International data transfers",
    body: (
      <p>
        We operate across the Middle East, Europe, Africa, Asia, North America and South America, and our infrastructure or service providers
        may be located outside your country, including outside the European Economic Area (EEA) or UK. Where we
        transfer personal data internationally, we use appropriate safeguards required by law, such as Standard
        Contractual Clauses. [Confirm hosting location(s) and, if data leaves the EEA/UK, the specific transfer
        mechanism relied on, once infrastructure/vendor decisions are finalized.]
      </p>
    ),
  },
  {
    id: "retention",
    title: "Data retention",
    body: (
      <p>
        We retain personal data for as long as needed to provide the platform and for the purposes described in
        this policy — for example, account and learning-record data for the life of your organisation&apos;s
        account plus a period afterward to meet audit, compliance and legal requirements, and sales-enquiry data
        for a reasonable period if you don&apos;t become a customer. [Define specific retention periods per data
        category — e.g. account data, learning records, compliance/certification records, sales enquiries — once
        finalized, since compliance record-keeping needs in particular may require longer statutory minimums.]
        When data is no longer needed, we delete or anonymise it.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>
          If GDPR or a similar law applies to you, you have the right to: access the personal data we hold about
          you; correct inaccurate data; request deletion (&ldquo;right to be forgotten&rdquo;); restrict or
          object to certain processing; receive your data in a portable format; and withdraw consent at any time
          where we rely on consent. Where your account is administered by your employer or organisation, some
          requests (e.g. deletion) may need to go through your organisation&apos;s administrator.
        </p>
        <p>
          To exercise any of these rights, contact us at <strong>[Privacy/Data Protection contact email]</strong>.
          We will respond within the timeframe required by applicable law. If you&apos;re not satisfied with our
          response, you have the right to lodge a complaint with your local data protection supervisory
          authority.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We use technical and organisational measures appropriate to the risk to protect personal data, including
        encryption of data in transit, access controls, and password hashing. No system is perfectly secure, and
        we cannot guarantee absolute security, but we work to protect your data and to respond quickly if an
        issue arises.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children’s privacy",
    body: (
      <p>
        Riyada Intelligence is a workplace learning platform intended for use by working adults through their employer or
        organisation. It is not directed at, and we do not knowingly collect personal data from, children.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy from time to time, for example as our product, providers, or legal obligations
        change. We&apos;ll update the &ldquo;Last updated&rdquo; date above when we do, and where changes are
        material, we&apos;ll take reasonable steps to notify account administrators.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <p>
        Questions about this policy or your data can be sent to <strong>[Privacy/Data Protection contact email]</strong>{" "}
        or by post to <strong>[Company registered address]</strong>.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={UPDATED}
      intro={
        <p>
          This policy is a first-pass draft covering the data Riyada Intelligence collects through its marketing site and
          platform today. Sections in <strong>[brackets]</strong> mark details that still need to be filled in
          with real company information.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
