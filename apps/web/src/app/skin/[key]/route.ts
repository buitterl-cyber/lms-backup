import { NextResponse } from "next/server";
import { SKINS, THEME_COOKIE } from "@/components/themes";

/** Shareable skin deep-link: /skin/sunset applies the skin and lands on the dashboard. */
export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const valid = SKINS.some((s) => s.key === key);
  // Behind nginx req.url is the internal origin — build the redirect from forwarded headers.
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "lms.excisone.com";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const res = NextResponse.redirect(`${proto}://${host}/learner`);
  if (valid) {
    res.cookies.set(THEME_COOKIE, key, { path: "/", maxAge: 31536000, sameSite: "lax" });
  }
  return res;
}
