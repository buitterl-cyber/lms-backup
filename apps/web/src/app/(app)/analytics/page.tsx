import { Card, EmptyState, MetricCard, Table, Td, Th, Thead } from "@/components/ui";
import { isAdmin, apiGet, getContext } from "@/lib/api";
import { AccessDenied } from "@/components/AccessDenied";

// First-party, cookieless pageview analytics for the public marketing site (see
// analytics.service.ts) — no cookie-consent banner needed since nothing here is a cookie or
// personal data. This page is the admin dashboard on top of that data.
export const dynamic = "force-dynamic";

interface Summary {
  since: string;
  totalViews: number;
  uniqueVisitors: number;
  topPaths: { path: string; count: number }[];
}

export default async function AnalyticsPage() {
  const ctx = await getContext();
  if (!isAdmin(ctx.roles)) return <AccessDenied />;
  const summary = await apiGet<Summary>("/analytics/summary?days=14", ctx).catch(
    () => ({ since: new Date().toISOString(), totalViews: 0, uniqueVisitors: 0, topPaths: [] }) as Summary,
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Site Analytics</h1>
        <p className="text-sm text-muted">Public marketing site, last 14 days. First-party and cookieless — no consent banner required.</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <MetricCard label="Pageviews (14d)" value={`${summary.totalViews}`} />
        <MetricCard label="Unique visitors (14d)" value={`${summary.uniqueVisitors}`} />
      </div>

      {summary.topPaths.length === 0 ? (
        <Card>
          <EmptyState
            icon="empty"
            title="No pageviews recorded yet"
            description="This fills in as visitors hit the public site."
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="border-b border-border p-4">
            <h2 className="text-sm font-medium">Top pages</h2>
          </div>
          <Table>
            <Thead>
              <tr className="border-b border-border">
                <Th>Path</Th><Th>Views</Th>
              </tr>
            </Thead>
            <tbody>
              {summary.topPaths.map((p) => (
                <tr key={p.path} className="border-b border-border/60">
                  <Td className="font-mono text-xs">{p.path}</Td>
                  <Td className="tnum">{p.count}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
