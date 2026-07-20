"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Mobile bottom tab bar — floating glass bar to match the rest of the chrome. */
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
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between rounded-2xl border border-border/80 bg-card/95 px-1.5 py-1 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] transition ${
                active ? "bg-brand/10 text-brand" : "text-muted hover:text-fg"
              }`}
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
