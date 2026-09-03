import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { GlobalErrorListener } from "@/components/GlobalErrorListener";

// Type system — revised 2026-08-04 for enterprise-compliance credibility (the previous DM
// Sans/Inter pairing read as generic consumer-SaaS-template). IBM Plex Serif carries
// headings/titles and big metrics — a structured, regulatory-document feel without being cold;
// IBM Plex Sans (same type family, so the pairing reads as designed, not mismatched) does the
// quiet UI/body work. Both variable, both self-hosted by next/font.
const plexSerif = IBM_Plex_Serif({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" });

const TITLE = "Riyada Intelligence — AI-Powered Workforce Intelligence Platform";
const DESCRIPTION =
  "Built to connect skills, compliance, certifications, careers and learning from the training providers you use into a single intelligence layer.";

export const metadata: Metadata = {
  metadataBase: new URL("https://riyadaintel.com"),
  title: TITLE,
  description: DESCRIPTION,
  appleWebApp: { capable: true, title: "Riyada Intelligence", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon.png", apple: "/icons/apple-touch-icon.png" },
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://riyadaintel.com",
    siteName: "Riyada Intelligence",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport = {
  themeColor: "#1e3a6e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Shell only. The marketing landing + login render full-bleed; the app shell (sidebar) lives in
  // the (app) route group's layout. The chosen skin AND locale come from cookies so SSR paints
  // both with no flash; each value is validated against its known keys before it touches the DOM.
  const { cookies } = await import("next/headers");
  const { SKINS, THEME_COOKIE, skinMode } = await import("@/components/themes");
  const { LOCALE_COOKIE, resolveLocale, dir } = await import("@/lib/i18n");
  const jar = await cookies();
  const rawTheme = jar.get(THEME_COOKIE)?.value;
  const theme = SKINS.some((s) => s.key === rawTheme) ? rawTheme : "riyada";
  const modeClass = skinMode(theme) === "dark" ? "dark" : "";
  const locale = resolveLocale(jar.get(LOCALE_COOKIE)?.value);
  return (
    <html lang={locale} dir={dir(locale)} data-theme={theme} className={`${modeClass} ${plexSerif.variable} ${plexSans.variable}`.trim()}>
      <body className="min-h-screen">
        <GlobalErrorListener />
        {children}
      </body>
    </html>
  );
}
