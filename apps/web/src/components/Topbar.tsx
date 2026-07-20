import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

/** App topbar — glass controls aligned with the marketing chrome language. */
export function Topbar({
  name,
  streak,
  level,
  levelProgress,
  unread,
}: {
  name: string;
  streak: number;
  level: number;
  levelProgress: number;
  unread: number;
}) {
  return (
    <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/70 p-2.5 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)] backdrop-blur-md sm:gap-3 sm:p-3">
      <form action="/catalog" className="min-w-0 flex-1">
        <input
          name="q"
          placeholder="Search courses…"
          className="w-full max-w-md rounded-xl border border-border bg-bg/70 px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand"
        />
      </form>
      {streak > 0 && (
        <span
          className="tnum hidden items-center gap-1.5 rounded-full border border-amber/30 bg-amber/10 px-3 py-1.5 text-xs font-medium text-amber sm:flex"
          title={`${streak}-day streak`}
        >
          🔥 {streak}
        </span>
      )}
      <LocaleSwitcher />
      <ThemeSwitcher />
      <Link
        href="/notifications"
        className="relative rounded-xl border border-border bg-bg/60 p-2.5 transition hover:border-brand/40 hover:bg-bg"
        aria-label={`Notifications — ${unread} unread`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="tnum absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
      <span title={`${name} · Level ${level}`} className="pe-0.5">
        <Avatar name={name} size={32} ring={levelProgress} />
      </span>
    </div>
  );
}
