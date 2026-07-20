// Minimal i18n + RTL. English and Arabic ship day one; `dir` flips the whole layout.
// Locale is a per-visitor preference resolved from a cookie, the same shape as the skin/theme
// cookie in components/themes.ts — no locale-prefixed routing, see LocaleSwitcher for why.
export type Locale = "en" | "ar";

export const LOCALE_COOKIE = "riyada_locale";

export interface LocaleInfo {
  key: Locale;
  /** English name, for logs/dev reference. */
  name: string;
  /** What the switcher actually displays — a language names itself, not translated. */
  nativeName: string;
}

export const LOCALES: LocaleInfo[] = [
  { key: "en", name: "English", nativeName: "English" },
  { key: "ar", name: "Arabic", nativeName: "العربية" },
];

export const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    readiness: "Workforce Readiness",
    whyHere: "Why you're here",
    recommended: "Recommended for you",
    why: "Why?",
    compliance: "Compliance",
    auditReady: "Audit-ready",
    expiring: "Certifications expiring",
    askAi: "Ask RIYADA AI",
  },
  ar: {
    readiness: "جاهزية القوى العاملة",
    whyHere: "لماذا أنت هنا",
    recommended: "موصى به لك",
    why: "لماذا؟",
    compliance: "الامتثال",
    auditReady: "جاهزية التدقيق",
    expiring: "الشهادات المنتهية",
    askAi: "اسأل ريادة الذكاء",
  },
};

export const dir = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");
export const t = (locale: Locale, key: string) => dictionaries[locale][key] ?? key;

/** Narrow a raw cookie value to a known Locale, defaulting to "en" — mirrors themes.ts's
 *  skinMode() validation shape for the skin cookie. */
export function resolveLocale(raw: string | undefined): Locale {
  return LOCALES.some((l) => l.key === raw) ? (raw as Locale) : "en";
}

/** Isomorphic locale read: cookies() on the server, document.cookie in the browser — the same
 *  split lib/api.ts's authToken() uses, so any server component can resolve "what's the current
 *  locale" (to call t()) without threading it through props, and the client-side LocaleSwitcher
 *  can read the same cookie without a fetch. */
export async function getLocale(): Promise<Locale> {
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      return resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value);
    } catch {
      return "en";
    }
  }
  const m = typeof document !== "undefined" ? document.cookie.match(/(?:^|; )riyada_locale=([^;]+)/) : null;
  return resolveLocale(m ? decodeURIComponent(m[1]) : undefined);
}
