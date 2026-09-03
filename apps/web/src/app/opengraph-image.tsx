import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "Riyada Intelligence — AI-Powered Workforce Intelligence Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social-preview card (LinkedIn/Slack/email link unfurls) for every page that doesn't set its
 *  own — Next.js app-router picks this up automatically via the `opengraph-image` file
 *  convention. Built with ImageResponse (no DOM in this runtime) rather than a static asset so
 *  it stays in lockstep with the brand tokens without a design tool round-trip. */
export default async function OgImage() {
  const markPath = join(process.cwd(), "public/brand/riyada-mark.png");
  const mark = await readFile(markPath);
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: "#1E3A6E",
          backgroundImage: "radial-gradient(circle at 82% 18%, rgba(245,166,35,0.35), transparent 55%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markSrc} width={56} height={56} alt="" />
          <span style={{ fontSize: 34, fontWeight: 600, color: "#ffffff", letterSpacing: "-0.01em" }}>
            Riyada<span style={{ fontWeight: 400, color: "rgba(255,255,255,0.7)", marginLeft: 6 }}>Intelligence</span>
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
          <span style={{ fontSize: 56, fontWeight: 600, color: "#ffffff", lineHeight: 1.12, letterSpacing: "-0.01em" }}>
            AI-powered workforce intelligence for regulated teams
          </span>
          <span style={{ fontSize: 26, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>
            Skills, compliance, certifications and learning — built to connect the providers you use — in one intelligence layer.
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
