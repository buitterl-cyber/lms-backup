import { Card, MetricCard } from "@/components/ui";
import { PipelineStatus } from "@/components/PipelineStatus";
import { apiGet, getContext } from "@/lib/api";

// Sales pipeline: every public-site inquiry lands here as a deal seed (new → contacted →
// qualified → won/lost). Submits also email sales in real time.
export const dynamic = "force-dynamic";

interface Inquiry {
  id: string; name: string; email: string; company: string | null; phone: string | null;
  message: string; courseTitle: string | null; status: string; createdAt: string;
}

export default async function SalesInquiriesPage() {
  const ctx = await getContext();
  const items = await apiGet<Inquiry[]>("/sales/pipeline", ctx).catch(() => [] as Inquiry[]);
  const open = items.filter((i) => ["new", "contacted", "qualified"].includes(i.status));
  const won = items.filter((i) => i.status === "won");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Sales Pipeline</h1>
        <p className="text-sm text-muted">Inquiries from the public course site — follow up ASAP.</p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Open deals" value={`${open.length}`} />
        <MetricCard label="New (untouched)" value={`${items.filter((i) => i.status === "new").length}`} />
        <MetricCard label="Won" value={`${won.length}`} />
      </div>

      {items.length === 0 ? (
        <Card>No inquiries yet — they&apos;ll appear here the moment someone submits the public form.</Card>
      ) : (
        <Card className="p-0">
          {items.map((i) => (
            <div key={i.id} className="border-b border-border/60 p-4 last:border-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{i.name} <span className="font-normal text-muted">· {i.email}{i.company ? ` · ${i.company}` : ""}{i.phone ? ` · ${i.phone}` : ""}</span></p>
                  {i.courseTitle && <p className="text-xs text-brand">Course: {i.courseTitle}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">{new Date(i.createdAt).toISOString().slice(0, 10)}</span>
                  <PipelineStatus ctx={ctx} id={i.id} status={i.status} />
                </div>
              </div>
              <p className="mt-2 text-sm text-muted">{i.message}</p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
