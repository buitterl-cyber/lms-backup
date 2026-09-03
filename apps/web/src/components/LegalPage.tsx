import type { ReactNode } from "react";
import { LaunchPopup } from "@/components/LaunchPopup";
import { MarketingFooter } from "@/components/MarketingFooter";
import { MarketingHeader } from "@/components/MarketingHeader";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** Shared shell for standalone legal/content pages (privacy, terms): same header/footer as the
 *  marketing homepage, but a plain, scannable single-column layout instead of the homepage's
 *  heavy visual bands — legal text reads better plain than "designed". */
export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: ReactNode; sections: LegalSection[] }) {
  return (
    <div className="mkt-page min-h-screen overflow-x-clip text-fg">
      <LaunchPopup />
      <MarketingHeader />

      <main className="mx-auto max-w-[760px] px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="font-display text-[1.85rem] font-semibold leading-tight tracking-tight text-fg sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>
        <div className="mt-5 space-y-3 text-[0.95rem] leading-relaxed text-fg/90 sm:text-base">{intro}</div>

        <nav aria-label="Sections on this page" className="mt-8 rounded-xl border border-border bg-card p-4 sm:mt-10 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">On this page</p>
          <ol className="mt-2.5 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-brand hover:underline">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-8 space-y-8 sm:mt-10 sm:space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="font-display text-lg font-semibold text-fg sm:text-xl">
                {i + 1}. {s.title}
              </h2>
              <div className="mt-2.5 space-y-3 text-[0.95rem] leading-relaxed text-fg/90 sm:text-base [&_a]:text-brand [&_a:hover]:underline [&_li]:leading-relaxed [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:ps-5 [&_strong]:font-semibold [&_strong]:text-fg [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:ps-5">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
