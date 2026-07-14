"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { isAdmin, apiGet, apiPost, getContext, type CatalogCourse, type DemoContext } from "@/lib/api";
import { AccessDenied } from "@/components/AccessDenied";

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
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh(c: DemoContext) {
    setPeople(await apiGet<Person[]>("/users", c));
    setCourses((await apiGet<{ items: CatalogCourse[] }>("/catalog/courses", c)).items.slice(0, 40));
  }
  useEffect(() => {
    getContext().then((c) => { setCtx(c); return refresh(c); }).catch(() => {});
  }, []);

  async function doInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!ctx || !invite.email) return;
    setBusy(true);
    try {
      await apiPost("/users", ctx, invite);
      setMsg(`Invited ${invite.email}.`);
      setInvite({ email: "", firstName: "", lastName: "", role: "learner" });
      await refresh(ctx);
    } catch {
      setMsg("Invite failed.");
    } finally {
      setBusy(false);
    }
  }

  async function doEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!ctx || !enroll.userId || !enroll.courseId) return;
    setBusy(true);
    try {
      await apiPost("/enrollments", ctx, { userId: enroll.userId, courseId: enroll.courseId, assignedReason: "Assigned by admin" });
      setMsg("Enrolled — provisioned into the connected platform if applicable.");
    } catch {
      setMsg("Enrol failed.");
    } finally {
      setBusy(false);
    }
  }

  if (ctx && !isAdmin(ctx.roles)) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">People</h1>
        <p className="text-sm text-muted">Invite your people and enlist them in courses across your connected platforms.</p>
      </header>

      {msg && <Card className="text-sm text-green">{msg}</Card>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-sm font-medium">Invite a person</h2>
          <form onSubmit={doInvite} className="mt-3 space-y-2">
            <input required placeholder="email@company.com" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand" />
            <div className="flex gap-2">
              <input placeholder="First name" value={invite.firstName} onChange={(e) => setInvite({ ...invite, firstName: e.target.value })} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand" />
              <input placeholder="Last name" value={invite.lastName} onChange={(e) => setInvite({ ...invite, lastName: e.target.value })} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand" />
            </div>
            <select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm">
              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
            </select>
            <button disabled={busy} className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-60">Invite</button>
          </form>
        </Card>

        <Card>
          <h2 className="text-sm font-medium">Enlist in a course</h2>
          <form onSubmit={doEnroll} className="mt-3 space-y-2">
            <select required value={enroll.userId} onChange={(e) => setEnroll({ ...enroll, userId: e.target.value })} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm">
              <option value="">Select person…</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.email}</option>)}
            </select>
            <select required value={enroll.courseId} onChange={(e) => setEnroll({ ...enroll, courseId: e.target.value })} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm">
              <option value="">Select course…</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <button disabled={busy} className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-60">Enrol</button>
          </form>
        </Card>
      </div>

      <Card className="p-0">
        <div className="border-b border-border p-4 text-sm font-medium">People ({people.length})</div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-border"><th className="p-4 font-medium">Name</th><th className="font-medium">Email</th><th className="font-medium">Title</th><th className="p-4 font-medium">Status</th></tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className="border-b border-border/60">
                <td className="p-4 font-medium">{p.firstName} {p.lastName}</td>
                <td className="text-muted">{p.email}</td>
                <td className="text-muted">{p.jobTitle ?? "—"}</td>
                <td className="p-4"><span className="rounded-full bg-bg px-2 py-0.5 text-xs text-muted ring-1 ring-border">{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
