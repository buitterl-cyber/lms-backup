import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Accessibility Statement — Riyada Intelligence",
  description: "Riyada Intelligence's commitment to accessibility, what we've built so far, known limitations, and how to report an issue.",
  alternates: { canonical: "/accessibility" },
};

const UPDATED = "20 August 2026";

const SECTIONS: LegalSection[] = [
  {
    id: "our-commitment",
    title: "Our commitment",
    body: (
      <>
        <p>
          Riyada Intelligence is a workforce-readiness platform used by learners, managers and compliance teams,
          and we want it to be usable by as many people as possible, including people who use assistive
          technology such as screen readers, or who navigate primarily by keyboard.
        </p>
        <p>
          Our goal is to meet the <strong>Web Content Accessibility Guidelines (WCAG) 2.1, Level AA</strong>. This
          is a commitment and an ongoing target we design and build toward &mdash; we have not commissioned an
          independent accessibility audit, and we do not claim formal WCAG 2.1 AA conformance or certification
          today. If a specific conformance statement matters for your procurement process, contact us and we&apos;ll
          be direct about where we currently stand.
        </p>
      </>
    ),
  },
  {
    id: "what-we-have-built",
    title: "What we've built so far",
    body: (
      <>
        <p>Some concrete accessibility work already in the product today:</p>
        <ul>
          <li>Visible keyboard focus indicators on interactive elements (links, buttons, form fields) for people navigating without a mouse.</li>
          <li>Animations and motion effects are reduced or removed when a visitor&apos;s system is set to reduce motion.</li>
          <li>Full right-to-left (RTL) layout support for Arabic &mdash; not just mirrored text, but a genuinely mirrored interface (navigation, spacing, icons).</li>
          <li>Descriptive alternative text on meaningful images, such as course artwork and the site logo.</li>
          <li>Correct, per-page HTML language and text-direction attributes, so assistive technology announces content correctly.</li>
        </ul>
      </>
    ),
  },
  {
    id: "known-limitations",
    title: "Known limitations",
    body: (
      <>
        <p>In the interest of being honest rather than aspirational, here&apos;s what we know still needs work:</p>
        <ul>
          <li>We have not yet run a formal WCAG 2.1 AA audit &mdash; either automated tooling or manual testing with real assistive technology &mdash; across the site or product.</li>
          <li>There is no &ldquo;skip to main content&rdquo; link yet for keyboard users to bypass repeated navigation.</li>
          <li>Complex, data-dense screens in the admin/manager product (dashboards, reports) have not been specifically reviewed for screen-reader usability.</li>
        </ul>
        <p>
          We&apos;ll update this page as these are addressed. If one of these limitations is currently blocking you
          from using the platform, please contact us using the details below &mdash; we&apos;d rather hear about it
          and help directly than have you work around it silently.
        </p>
      </>
    ),
  },
  {
    id: "report-an-issue",
    title: "Report an accessibility issue",
    body: (
      <>
        <p>
          If you encounter an accessibility barrier anywhere on this site or in the product, email{" "}
          <a href="mailto:accessibility@riyadaintel.com">accessibility@riyadaintel.com</a> with a description of the
          issue, the page or screen it&apos;s on, and the assistive technology or browser you were using. We&apos;ll
          do our best to respond and help, including providing the information you need in an alternate format if
          that helps.
        </p>
      </>
    ),
  },
];

export default function AccessibilityPage() {
  return (
    <LegalPage
      title="Accessibility Statement"
      updated={UPDATED}
      intro={
        <p>
          This page describes our approach to accessibility on the Riyada Intelligence website and platform: what
          we&apos;re committing to, what&apos;s already in place, what isn&apos;t yet, and how to reach us about it.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
