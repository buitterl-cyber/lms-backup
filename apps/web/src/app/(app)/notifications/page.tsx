import { Card } from "@/components/ui";
import { apiGet, getContext } from "@/lib/api";

// Notifications — in-app feed (renewal reminders, compliance alerts, assignments). Delivery to
// email/push is a transport seam; the records are real.
export const dynamic = "force-dynamic";

interface Notif {
  id: string;
  kind: string;
  channel: string;
  payload: { certification?: string; message?: string; [k: string]: unknown };
  readAt: string | null;
  createdAt: string;
}

const KIND_LABEL: Record<string, string> = {
  certification_renewal: "Certification renewal",
  compliance_alert: "Compliance alert",
  assignment: "Training assigned",
  nudge: "Reminder",
  forum_reply: "Forum reply",
  peer_review: "Work reviewed",
};

async function load() {
  try {
    const ctx = await getContext();
    return await apiGet<Notif[]>(`/users/${ctx.userId}/notifications`, ctx);
  } catch {
    return [];
  }
}

export default async function NotificationsPage() {
  const notifs = await load();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted">{notifs.length} notification{notifs.length === 1 ? "" : "s"}</p>
      </header>

      {notifs.length === 0 ? (
        <Card>You&apos;re all caught up.</Card>
      ) : (
        <Card className="p-0">
          {notifs.map((n) => (
            <div key={n.id} className="flex items-start gap-3 border-b border-border/60 p-4 last:border-0">
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.readAt ? "bg-border" : "bg-brand"}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{KIND_LABEL[n.kind] ?? n.kind}</p>
                <p className="text-sm text-muted">
                  {n.payload?.message ?? (n.payload?.certification ? `${n.payload.certification} needs attention.` : "Update available.")}
                </p>
                <p className="mt-1 text-xs text-muted">{new Date(n.createdAt).toLocaleString()} · {n.channel}</p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
