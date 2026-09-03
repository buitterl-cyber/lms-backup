"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, type DemoContext } from "@/lib/api";
import { Button } from "@/components/ui";
import { isValidEmail } from "@/lib/validation";

/** Manager "add team member" (Team Dashboard): invites a learner into the manager's own
 *  organization — scoped server-side, same /users endpoint the People page uses. Optionally
 *  assigns a course at invite time: the invite email links to the learner login page, and the
 *  course is auto-enrolled the moment the invitee signs up or logs in (see AuthService). */
export function AddTeamMemberForm({ ctx, courses = [] }: { ctx: DemoContext; courses?: { courseId: string; title: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", courseId: "" });
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [validationError, setValidationError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");
    if (!isValidEmail(form.email)) {
      setValidationError("Enter a valid email address.");
      return;
    }
    setState("busy");
    try {
      const { courseId, ...rest } = form;
      await apiPost("/users", ctx, { ...rest, role: "learner", ...(courseId ? { courseId } : {}) });
      setForm({ email: "", firstName: "", lastName: "", courseId: "" });
      setOpen(false);
      setState("idle");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  if (!open)
    return <Button onClick={() => setOpen(true)}>+ Add team member</Button>;

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2" noValidate>
      <input
        required
        type="email"
        placeholder="email@company.com"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-48 rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <input
        placeholder="First name"
        value={form.firstName}
        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        className="w-32 rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <input
        placeholder="Last name"
        value={form.lastName}
        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        className="w-32 rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
      />
      {courses.length > 0 && (
        <select
          value={form.courseId}
          onChange={(e) => setForm({ ...form, courseId: e.target.value })}
          className="w-44 rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">No course assignment</option>
          {courses.map((c) => (
            <option key={c.courseId} value={c.courseId}>
              {c.title}
            </option>
          ))}
        </select>
      )}
      <Button disabled={state === "busy"}>
        {state === "busy" ? "Adding…" : "Add"}
      </Button>
      <Button type="button" onClick={() => setOpen(false)} variant="secondary" className="text-muted">
        Cancel
      </Button>
      {validationError && <span className="text-xs text-red" role="alert">{validationError}</span>}
      {state === "error" && <span className="text-xs text-red" role="alert">Couldn&apos;t add that person — check the email.</span>}
    </form>
  );
}
