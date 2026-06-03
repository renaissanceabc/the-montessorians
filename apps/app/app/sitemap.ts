import { db } from "@repo/database";
import { profiles, tags } from "@repo/database/schema";
import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { siteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheTag("profiles", "tags", "sitemap");
  cacheLife("days");
  const [allProfiles, allTags] = await Promise.all([
    db.select({ slug: profiles.slug, createdAt: profiles.createdAt }).from(profiles),
    db.select({ slug: tags.slug }).from(tags),
  ]);

  const profileUrls = allProfiles.map((profile) => ({
    url: `${siteUrl}/${profile.slug}`,
    lastModified: new Date(profile.createdAt ?? Date.now()),
    changeFrequency: "weekly" as const,
    priority: 0.6,
    images: [`${siteUrl}/api/og/${profile.slug}.png`],
  }));

  const tagUrls = allTags.map((tag) => ({
    url: `${siteUrl}/tags/${tag.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/archive`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/tags`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...profileUrls,
    ...tagUrls,
  ];
}
