// Minimal i18n + RTL. English and Arabic ship day one; `dir` flips the whole layout.
export type Locale = "en" | "ar";

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
