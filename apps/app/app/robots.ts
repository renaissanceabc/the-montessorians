import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/api/og/"],
        disallow: ["/api/", "/_next/", "/app/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
