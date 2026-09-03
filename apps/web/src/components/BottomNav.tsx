"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Mobile bottom tab bar — floating glass bar; labels stay fully visible on narrow phones. */
const TABS = [
  { href: "/learner", icon: "🏠", label: "Home" },
  { href: "/catalog", icon: "📚", label: "Courses" },
  { href: "/my-learning", icon: "🎯", label: "Learn" },
  { href: "/team", icon: "📊", label: "Manage" },
  { href: "/notifications", icon: "🔔", label: "Alerts" },
];

export function BottomNav({ manage = true }: { manage?: boolean }) {
  const pathname = usePathname();
  const tabs = manage ? TABS : TABS.filter((t) => t.href !== "/team");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] md:hidden">
      <div
        className="mx-auto grid max-w-md gap-0.5 rounded-2xl border border-border/80 bg-card/95 p-1 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.45)] backdrop-blur-xl"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-center transition ${
                active ? "bg-brand/10 text-brand" : "text-muted"
              }`}
            >
              <span className="text-base leading-none" aria-hidden>
                {t.icon}
              </span>
              <span className="w-full truncate text-[10px] font-medium leading-tight">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
