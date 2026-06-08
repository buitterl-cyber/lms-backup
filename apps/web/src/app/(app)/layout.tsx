import type { ReactNode } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

// App shell. Sidebar exposes the platform surfaces from the plan: dashboard, the course
// aggregator, the intelligence engines (skills/career/compliance/certifications), the
// marketplace, and RIYADA AI.
const NAV: { group: string; items: { href: string; label: string }[] }[] = [
  { group: "Workspace", items: [{ href: "/learner", label: "Dashboard" }, { href: "/catalog", label: "Course Catalog" }, { href: "/my-learning", label: "My Learning" }, { href: "/notifications", label: "Notifications" }, { href: "/marketplace", label: "Marketplace" }] },
  { group: "Intelligence", items: [
    { href: "/skills", label: "Skills & Gaps" },
    { href: "/team", label: "Team Readiness" },
    { href: "/career", label: "Career Studio" },
    { href: "/compliance", label: "Compliance" },
    { href: "/certifications", label: "Certifications" },
  ] },
  { group: "Assistant", items: [{ href: "/ai", label: "RIYADA AI" }] },
  { group: "Admin", items: [{ href: "/people", label: "People" }, { href: "/providers", label: "Providers" }, { href: "/reports", label: "Reports" }] },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
      <aside className="w-52 shrink-0">
        <Link href="/" className="block text-lg font-semibold tracking-tight">
          Riyada<span className="text-brand">Intel</span>
        </Link>
        <nav className="mt-8 space-y-5">
          {NAV.map((g) => (
            <div key={g.group}>
              <p className="px-3 text-[10px] font-medium uppercase tracking-widest text-muted">{g.group}</p>
              <div className="mt-1 flex flex-col gap-0.5">
                {g.items.map((n) => (
                  <Link key={n.href} href={n.href} className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-card hover:text-fg">
                    {n.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <LogoutButton className="mt-8 block px-3 text-xs text-muted hover:text-fg" />
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
