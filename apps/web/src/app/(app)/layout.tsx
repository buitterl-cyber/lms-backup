import type { ReactNode } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { BottomNav } from "@/components/BottomNav";
import { Avatar } from "@/components/Avatar";
import { Topbar } from "@/components/Topbar";
import { Brand } from "@/components/Brand";
import { Card } from "@/components/ui";
import { apiGet, getContext, isAdmin } from "@/lib/api";

// App shell — same navy/teal atmosphere as the marketing site: soft aurora, glass sidebar,
// elevated cards. Mobile (<md): sidebar collapses, bottom tab bar takes over.
const NAV: { group: string; items: { href: string; label: string }[] }[] = [
  { group: "Workspace", items: [{ href: "/learner", label: "Dashboard" }, { href: "/catalog", label: "Course Catalog" }, { href: "/my-learning", label: "My Learning" }, { href: "/notifications", label: "Notifications" }, { href: "/marketplace", label: "Marketplace" }] },
  { group: "Intelligence", items: [
    { href: "/skills", label: "Skills & Gaps" },
    { href: "/team", label: "Team Dashboard" },
    { href: "/career", label: "Career Studio" },
    { href: "/compliance", label: "Compliance" },
    { href: "/certifications", label: "Certifications" },
  ] },
  { group: "Assistant", items: [{ href: "/ai", label: "RIYADA AI" }] },
  { group: "Teaching", items: [{ href: "/instructor", label: "Instructor" }] },
  { group: "Admin", items: [
    { href: "/people", label: "People" },
    { href: "/providers", label: "Providers" },
    { href: "/reports", label: "Reports" },
    { href: "/sales-inquiries", label: "Sales Pipeline" },
  ] },
];

interface Game { totalXp: number; level: number; nextLevelXp: number; streak: number }
interface Notif { readAt: string | null }

async function identity() {
  try {
    const ctx = await getContext();
    const [game, notifs] = await Promise.all([
      apiGet<Game>(`/gamification/me?userId=${ctx.userId}`, ctx).catch(() => null),
      apiGet<Notif[]>(`/users/${ctx.userId}/notifications`, ctx).catch(() => [] as Notif[]),
    ]);
    const level = game?.level ?? 1;
    const prev = (level - 1) * (level - 1) * 100;
    const next = game?.nextLevelXp ?? 100;
    return {
      name: ctx.userName || "Learner",
      role: (ctx.roles?.[0] ?? "learner").replace(/_/g, " "),
      admin: isAdmin(ctx.roles),
      xp: game?.totalXp ?? 0,
      level,
      levelProgress: next > prev ? ((game?.totalXp ?? 0) - prev) / (next - prev) : 0,
      nextLevelXp: next,
      streak: game?.streak ?? 0,
      unread: notifs.filter((n) => !n.readAt).length,
    };
  } catch {
    return { name: "Learner", role: "learner", admin: true, xp: 0, level: 1, levelProgress: 0, nextLevelXp: 100, streak: 0, unread: 0 };
  }
}

const ADMIN_GROUPS = new Set(["Teaching", "Admin"]);
const ADMIN_ITEMS = new Set(["/team"]);

export default async function AppLayout({ children }: { children: ReactNode }) {
  const me = await identity();
  const nav = me.admin
    ? NAV
    : NAV.filter((g) => !ADMIN_GROUPS.has(g.group)).map((g) => ({
        ...g,
        items: g.items.filter((n) => !ADMIN_ITEMS.has(n.href)),
      }));

  return (
    <>
      <div className="aurora" aria-hidden />
      <div className="relative mx-auto flex max-w-6xl gap-6 px-4 py-5 md:gap-8 md:px-6 md:py-7">
        <aside className="hidden w-[15.5rem] shrink-0 md:flex md:flex-col">
          <div className="sticky top-5 flex max-h-[calc(100vh-2.5rem)] flex-col rounded-2xl border border-border/80 bg-card/80 p-4 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.4)] backdrop-blur-md">
            <Link href="/" className="block px-1">
              <Brand size={28} className="text-lg" />
            </Link>
            <nav className="mt-6 flex-1 space-y-5 overflow-y-auto pe-1">
              {nav.map((g) => (
                <div key={g.group}>
                  <p className="px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{g.group}</p>
                  <div className="mt-1.5 flex flex-col gap-0.5">
                    {g.items.map((n) => (
                      <Link
                        key={n.href}
                        href={n.href}
                        className="flex items-center justify-between rounded-xl px-2.5 py-2 text-sm text-muted transition hover:bg-bg hover:text-fg"
                      >
                        {n.label}
                        {n.href === "/notifications" && me.unread > 0 && (
                          <span className="tnum rounded-full bg-accentTeal/15 px-1.5 text-[10px] font-semibold text-accentTealInk">
                            {me.unread}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <Card translucent padding="sm" className="mt-4 !shadow-none">
              <div className="flex items-center gap-3">
                <Avatar name={me.name} size={34} ring={me.levelProgress} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{me.name}</p>
                  <p className="truncate text-[11px] capitalize text-muted">{me.role} · Level {me.level}</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-accentTeal"
                  style={{ width: `${Math.round(me.levelProgress * 100)}%` }}
                />
              </div>
              <p className="tnum mt-1.5 text-[10px] text-muted">
                {me.xp.toLocaleString()} / {me.nextLevelXp.toLocaleString()} XP
              </p>
              <LogoutButton className="mt-2 block text-[11px] text-muted hover:text-fg" />
            </Card>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-20 md:pb-0">
          <Topbar name={me.name} streak={me.streak} level={me.level} levelProgress={me.levelProgress} unread={me.unread} />
          <div className="rise">{children}</div>
        </main>
        <BottomNav manage={me.admin} />
      </div>
    </>
  );
}
