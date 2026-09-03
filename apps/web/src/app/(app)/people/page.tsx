"use client";

import { useEffect, useState } from "react";
import { Button, Card, EmptyState, SkeletonTable, Table, Td, Th, Thead } from "@/components/ui";
import { isAdmin, apiGet, apiPost, getContext, type CatalogCourse, type DemoContext } from "@/lib/api";
import { AccessDenied } from "@/components/AccessDenied";
import { isValidEmail } from "@/lib/validation";

// Client dashboard — manage your people: invite them, and enrol them in courses. When the course
// comes from a connected provider (e.g. the client's LearnWorlds), the enrolment provisions the
// learner into THAT platform too.
interface Person { id: string; email: string; firstName: string; lastName: string; jobTitle?: string; status: string }
const ROLES = ["learner", "dept_manager", "compliance_manager", "hr_manager", "trainer", "org_admin"];

export default function PeoplePage() {
  const [ctx, setCtx] = useState<DemoContext | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [invite, setInvite] = useState({ email: "", firstName: "", lastName: "", role: "learner" });
  const [enroll, setEnroll] = useState({ userId: "", courseId: "" });
  const [msg, setMsg] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [busy, setBusy] = useState(false);
  // Distinguishes "haven't fetched yet" from "fetched and there are genuinely zero people" —
  // without this, the People (0) header and empty table flash before the real data arrives.
  const [initialLoading, setInitialLoading] = useState(true);

  async function refresh(c: DemoContext) {
    setPeople(await apiGet<Person[]>("/users", c));
    setCourses((await apiGet<{ items: CatalogCourse[] }>("/catalog/courses", c)).items.slice(0, 40));
  }
  useEffect(() => {
    getContext().then((c) => { setCtx(c); return refresh(c); }).catch(() => {}).finally(() => setInitialLoading(false));
  }, []);

  async function doInvite(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!ctx) return;
    if (!isValidEmail(invite.email)) {
      setMsg({ text: "Enter a valid email address.", tone: "error" });
      return;
    }
    setBusy(true);
    try {
      await apiPost("/users", ctx, invite);
      setMsg({ text: `Invited ${invite.email}.`, tone: "success" });
      setInvite({ email: "", firstName: "", lastName: "", role: "learner" });
      await refresh(ctx);
    } catch {
      setMsg({ text: "Invite failed.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function doEnroll(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!ctx) return;
    if (!enroll.userId || !enroll.courseId) {
      setMsg({ text: "Select both a person and a course.", tone: "error" });
      return;
    }
    setBusy(true);
    try {
      await apiPost("/enrollments", ctx, { userId: enroll.userId, courseId: enroll.courseId, assignedReason: "Assigned by admin" });
      setMsg({ text: "Enrolled — provisioned into the connected platform if applicable.", tone: "success" });
    } catch {
      setMsg({ text: "Enrol failed.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (ctx && !isAdmin(ctx.roles)) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-xl font-semibold sm:text-2xl">People</h1>
        <p className="text-sm text-muted">Invite your people and enlist them in courses across your connected platforms.</p>
      </header>

      {msg && <Card className={`text-sm ${msg.tone === "success" ? "text-green" : "text-red"}`} role={msg.tone === "error" ? "alert" : undefined}>{msg.text}</Card>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-sm font-medium">Invite a person</h2>
          <form onSubmit={doInvite} className="mt-3 space-y-2" noValidate>
            <input required type="email" placeholder="email@company.com" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand" />
            <div className="flex gap-2">
              <input placeholder="First name" value={invite.firstName} onChange={(e) => setInvite({ ...invite, firstName: e.target.value })} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand" />
              <input placeholder="Last name" value={invite.lastName} onChange={(e) => setInvite({ ...invite, lastName: e.target.value })} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand" />
            </div>
            <select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm">
              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
            </select>
            <Button disabled={busy} className="w-full">Invite</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-sm font-medium">Enlist in a course</h2>
          <form onSubmit={doEnroll} className="mt-3 space-y-2" noValidate>
            <select required value={enroll.userId} onChange={(e) => setEnroll({ ...enroll, userId: e.target.value })} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm">
              <option value="">Select person…</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.email}</option>)}
            </select>
            <select required value={enroll.courseId} onChange={(e) => setEnroll({ ...enroll, courseId: e.target.value })} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm">
              <option value="">Select course…</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <Button disabled={busy} className="w-full">Enrol</Button>
          </form>
        </Card>
      </div>

      {initialLoading ? (
        <SkeletonTable />
      ) : people.length === 0 ? (
        <Card>
          <EmptyState
            icon="empty"
            title="No people yet"
            description="Invite your first person above and they'll show up here."
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="border-b border-border p-4 text-sm font-medium">People ({people.length})</div>
          <Table>
            <Thead>
              <tr className="border-b border-border"><Th>Name</Th><Th>Email</Th><Th>Title</Th><Th>Status</Th></tr>
            </Thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id} className="border-b border-border/60">
                  <Td className="font-medium">{p.firstName} {p.lastName}</Td>
                  <Td className="text-muted">{p.email}</Td>
                  <Td className="text-muted">{p.jobTitle ?? "—"}</Td>
                  <Td><span className="rounded-full bg-bg px-2 py-0.5 text-xs text-muted ring-1 ring-border">{p.status}</span></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
