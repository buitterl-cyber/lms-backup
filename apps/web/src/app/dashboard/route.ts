import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_ROLES, TOKEN_COOKIE } from "@/lib/api";

const API = (process.env.API_INTERNAL_URL || process.env.API_URL || "http://localhost:4400") + "/api/v1";

/** Role-aware landing: managers → team dashboard, learners → learner dashboard,
 *  anonymous → role selection. */
export async function GET(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "lms.excisone.com";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const to = (path: string) => NextResponse.redirect(`${proto}://${host}${path}`);

  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return to("/login");
  try {
    const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!res.ok) return to("/login");
    const me = (await res.json()) as { roles?: string[] };
    const admin = (me.roles ?? []).some((r) => ADMIN_ROLES.includes(r));
    return to(admin ? "/team" : "/learner");
  } catch {
    return to("/login");
  }
}
