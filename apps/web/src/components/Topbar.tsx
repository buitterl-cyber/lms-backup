import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

/** Wireframe topbar: global course search, streak flame, notification bell with a live unread
 *  count, and the identity avatar with its level ring. Server-rendered; search works without JS. */
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
    <div className="mb-6 flex items-center gap-3">
      <form action="/catalog" className="min-w-0 flex-1">
        <input
          name="q"
          placeholder="Search courses…"
          className="w-full max-w-sm rounded-xl border border-border bg-card/70 px-4 py-2 text-sm outline-none backdrop-blur placeholder:text-muted focus:border-brand"
        />
      </form>
      {streak > 0 && (
        <span className="tnum hidden items-center gap-1.5 rounded-full border border-amber/30 bg-amber/10 px-3 py-1.5 text-xs font-medium text-amber sm:flex" title={`${streak}-day streak`}>
          🔥 {streak}
        </span>
      )}
      <ThemeSwitcher />
      <Link href="/notifications" className="relative rounded-xl border border-border bg-card/70 p-2 backdrop-blur hover:border-brand/50" aria-label={`Notifications — ${unread} unread`}>
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
      <span title={`${name} · Level ${level}`}>
        <Avatar name={name} size={32} ring={levelProgress} />
      </span>
    </div>
  );
}
