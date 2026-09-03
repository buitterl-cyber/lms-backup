import type { MetadataRoute } from "next";

const BASE_URL = "https://riyadaintel.com";
const API = (process.env.API_INTERNAL_URL || process.env.API_URL || "http://localhost:4400") + "/api/v1";

interface SalesCourse {
  id: string;
  updatedAt?: string;
}

/** Public course IDs for /courses/[id] entries. Best-effort — an API hiccup shouldn't break the
 *  whole sitemap, so this degrades to an empty list rather than throwing. */
async function courseIds(): Promise<string[]> {
  try {
    const res = await fetch(`${API}/sales/catalog?limit=60`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { items: SalesCourse[] };
    return data.items.map((c) => c.id);
  } catch {
    return [];
  }
}

/** Sitemap for the public marketing + sales site only — everything behind login (the learner/admin
 *  portal, under the (app) route group and friends) is intentionally excluded; see robots.ts. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/security`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/company`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/courses`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/accessibility`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const ids = await courseIds();
  const courseEntries: MetadataRoute.Sitemap = ids.map((id) => ({
    url: `${BASE_URL}/courses/${id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticEntries, ...courseEntries];
}
