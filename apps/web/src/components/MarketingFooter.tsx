"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/Brand";

// Section anchors only exist on the homepage. Off the homepage (e.g. /privacy, /terms) they need
// a leading "/" so the link navigates home first, then jumps to the section — a bare "#product"
// on a page with no such id would silently do nothing.
const SECTION_LINKS = [
  { href: "#product", label: "Product", kind: "anchor" },
  { href: "/security", label: "Compliance", kind: "page" },
  { href: "#integrations", label: "Content Library", kind: "anchor" },
  { href: "/pricing", label: "Pricing", kind: "page" },
  { href: "/company", label: "Company", kind: "page" },
] as const;

/** Shared marketing-site footer — used on the homepage and on standalone content pages
 *  (privacy, terms) so the same brand/nav/legal links appear everywhere. */
export function MarketingFooter() {
  const pathname = usePathname();
  const prefix = pathname === "/" ? "" : "/";

  return (
    <footer className="border-t border-border bg-card py-8 sm:py-10">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div>
            <Brand size={24} className="text-sm" />
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">
              AI-Powered Workforce Intelligence ·{" "}Middle East ·{" "}Europe ·{" "}Africa ·{" "}
              Asia ·{" "}North America ·{" "}South America
            </p>
          </div>
          <nav className="-m-2 flex flex-wrap text-xs text-muted" aria-label="Footer">
            {SECTION_LINKS.map((item) =>
              item.kind === "page" ? (
                <Link key={item.href} href={item.href} className="flex min-h-11 items-center px-2 hover:text-fg">
                  {item.label}
                </Link>
              ) : (
                <a key={item.href} href={`${prefix}${item.href}`} className="flex min-h-11 items-center px-2 hover:text-fg">
                  {item.label}
                </a>
              ),
            )}
            <Link href="/login" className="flex min-h-11 items-center px-2 hover:text-fg">Log in</Link>
            <a href={`${prefix}#book-demo`} className="flex min-h-11 items-center px-2 hover:text-fg">Book a demo</a>
          </nav>
        </div>
        <div className="flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-xs text-muted">© {new Date().getFullYear()} Riyada Intelligence. All rights reserved.</p>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Legal &amp; trust</p>
            <nav className="-m-2 mt-1.5 flex flex-wrap text-xs font-medium text-fg/80" aria-label="Legal">
              <Link href="/privacy" className="flex min-h-11 items-center px-2 hover:text-fg">Privacy Policy</Link>
              <Link href="/terms" className="flex min-h-11 items-center px-2 hover:text-fg">Terms of Service</Link>
              <Link href="/security" className="flex min-h-11 items-center px-2 hover:text-fg">Security</Link>
              <Link href="/accessibility" className="flex min-h-11 items-center px-2 hover:text-fg">Accessibility</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
