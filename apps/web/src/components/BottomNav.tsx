"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Mobile bottom tab bar (wireframe: Home · Courses · Forum · Manage · Profile).
 *  Hidden on md+ where the sidebar takes over. */
const TABS = [
  { href: "/learner", icon: "🏠", label: "Home" },
  { href: "/catalog", icon: "📚", label: "Courses" },
  { href: "/my-learning", icon: "🎯", label: "Learning" },
  { href: "/team", icon: "📊", label: "Manage" },
  { href: "/notifications", icon: "🔔", label: "Alerts" },
];

export function BottomNav({ manage = true }: { manage?: boolean }) {
  const pathname = usePathname();
  const tabs = manage ? TABS : TABS.filter((t) => t.href !== "/team");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${active ? "text-brand" : "text-muted"}`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
