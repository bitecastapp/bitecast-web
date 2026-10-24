import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.nomrank.in";

// Search engines may crawl everything public; private and tooling areas stay out of results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/settings", "/notifications", "/auth/", "/dev/"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
