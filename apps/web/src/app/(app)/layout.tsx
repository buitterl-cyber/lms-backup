import type { ReactNode } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { BottomNav } from "@/components/BottomNav";
import { Avatar } from "@/components/Avatar";
import { Topbar } from "@/components/Topbar";
import { Brand } from "@/components/Brand";
import { apiGet, getContext, isAdmin } from "@/lib/api";

// App shell, wireframe anatomy: grouped sidebar nav + a user identity card pinned at the
// bottom, a topbar with global search + notification bell, aurora wash on the top edge.
// Mobile (<md): sidebar collapses away, bottom tab bar takes over.
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

// Admin-only surfaces disappear from a learner's navigation entirely (the pages themselves
// are guarded too — hiding is UX, the guard is the rule).
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
      <div className="relative mx-auto flex max-w-6xl gap-8 px-4 py-6 md:px-6 md:py-8">
        <aside className="hidden w-56 shrink-0 md:flex md:flex-col">
          <Link href="/" className="block">
            <Brand size={28} className="text-xl" />
          </Link>
          <nav className="mt-8 flex-1 space-y-5">
            {nav.map((g) => (
              <div key={g.group}>
                <p className="px-3 text-[10px] font-medium uppercase tracking-widest text-muted">{g.group}</p>
                <div className="mt-1 flex flex-col gap-0.5">
                  {g.items.map((n) => (
                    <Link key={n.href} href={n.href} className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-card hover:text-fg">
                      {n.label}
                      {n.href === "/notifications" && me.unread > 0 && (
                        <span className="tnum rounded-full bg-brand/15 px-1.5 text-[10px] font-semibold text-brand">{me.unread}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Identity card (wireframe sidebar footer): who you are, how far to the next level. */}
          <div className="mt-8 rounded-xl border border-border bg-card/70 p-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <Avatar name={me.name} size={34} ring={me.levelProgress} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{me.name}</p>
                <p className="truncate text-[11px] capitalize text-muted">{me.role} · Level {me.level}</p>
              </div>
            </div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full" style={{ width: `${Math.round(me.levelProgress * 100)}%`, background: "linear-gradient(to right, rgb(var(--brand)), rgb(var(--aurora2)))" }} />
            </div>
            <p className="tnum mt-1.5 text-[10px] text-muted">{me.xp.toLocaleString()} / {me.nextLevelXp.toLocaleString()} XP</p>
            <LogoutButton className="mt-2 block text-[11px] text-muted hover:text-fg" />
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
