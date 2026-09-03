import { Card, EmptyState, MetricCard, Table, Td, Th, Thead } from "@/components/ui";
import { isAdmin, apiGet, getContext } from "@/lib/api";
import { AccessDenied } from "@/components/AccessDenied";

// Error monitoring viewer: the API persists every 5xx (backend) and reported client exception
// (frontend) to ErrorLog and alerts by email in real time (see error-log.ts). This page is the
// at-a-glance dashboard on top of that same data — /errors already existed as an API-only endpoint.
export const dynamic = "force-dynamic";

interface ErrorEntry {
  id: string;
  source: "api" | "web";
  message: string;
  stack: string | null;
  path: string | null;
  method: string | null;
  statusCode: number | null;
  createdAt: string;
}

export default async function ErrorsPage() {
  const ctx = await getContext();
  if (!isAdmin(ctx.roles)) return <AccessDenied />;
  const items = await apiGet<ErrorEntry[]>("/errors?limit=100", ctx).catch(() => [] as ErrorEntry[]);
  const last24h = items.filter((e) => Date.now() - new Date(e.createdAt).getTime() < 24 * 60 * 60 * 1000);
  const apiErrors = items.filter((e) => e.source === "api");
  const webErrors = items.filter((e) => e.source === "web");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Error Monitoring</h1>
        <p className="text-sm text-muted">Backend and frontend errors, most recent first. Severe errors also alert by email.</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <MetricCard label="Last 24h" value={`${last24h.length}`} />
        <MetricCard label="API errors" value={`${apiErrors.length}`} />
        <MetricCard label="Web errors" value={`${webErrors.length}`} />
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon="empty"
            title="No errors logged yet"
            description="This page fills in the moment something throws."
          />
        </Card>
      ) : (
        <Card padding="none">
          <Table>
            <Thead>
              <tr className="border-b border-border">
                <Th>When</Th><Th>Source</Th><Th>Status</Th><Th>Path</Th><Th>Message</Th>
              </tr>
            </Thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className="border-b border-border/60 align-top">
                  <Td className="whitespace-nowrap text-xs text-muted">{new Date(e.createdAt).toLocaleString()}</Td>
                  <Td className="text-xs uppercase text-muted">{e.source}</Td>
                  <Td className="font-mono text-xs">{e.statusCode ?? "—"}</Td>
                  <Td className="max-w-[16rem] truncate text-xs text-muted">{e.method ? `${e.method} ` : ""}{e.path ?? "—"}</Td>
                  <Td className="max-w-[28rem] break-words text-sm">{e.message}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
