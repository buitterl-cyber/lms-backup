import type { MetadataRoute } from "next";

const BASE_URL = "https://riyadaintel.com";

/** Default-deny + explicit allow-list: safer than enumerating every login-gated route by name,
 *  since new portal pages (learner/admin/manager dashboards, the (app) route group, auth flows)
 *  are excluded automatically without needing a robots.ts update every time one's added.
 *  /_next/, /images/, /icons/, /brand/ etc. are allowed so crawlers can still fetch the assets
 *  referenced by allowed pages (Googlebot renders pages and needs CSS/JS to do it accurately). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/$",
        "/pricing$",
        "/security$",
        "/company$",
        "/terms$",
        "/privacy$",
        "/courses",
        "/_next/",
        "/images/",
        "/icons/",
        "/brand/",
        "/videos/",
        "/opengraph-image",
        "/icon.png",
        "/manifest.webmanifest",
      ],
      disallow: "/",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
