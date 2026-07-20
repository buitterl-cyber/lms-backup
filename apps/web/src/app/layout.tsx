import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";

// Type system (14-Jul spec): DM Sans carries headings/titles and big metrics;
// Inter does the quiet UI work. Both variable, both self-hosted by next/font.
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "RiyadaIntel — AI-Powered Workforce Intelligence Platform",
  description:
    "Connect skills, compliance, certifications, careers and learning from every major training provider into a single intelligence layer.",
  appleWebApp: { capable: true, title: "RiyadaIntel", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport = {
  themeColor: "#4f46e5",
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
    <html lang={locale} dir={dir(locale)} data-theme={theme} className={`${modeClass} ${dmSans.variable} ${inter.variable}`.trim()}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
