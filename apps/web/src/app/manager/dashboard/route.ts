import { NextResponse } from "next/server";

/** Alias: the manager dashboard lives at /team (role-guarded there). */
export async function GET(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "lms.excisone.com";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return NextResponse.redirect(`${proto}://${host}/team`);
}
