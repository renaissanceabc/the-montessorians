import type { MetadataRoute } from "next";

import { getAllOrganizations } from "@/lib/content/organizations";
import { getAllProfiles, getAllTags } from "@/lib/content/profiles";
import { siteUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const allProfiles = getAllProfiles();
  const allTags = getAllTags().data;

  const profileUrls = allProfiles.map((profile) => ({
    changeFrequency: "weekly" as const,
    images: profile.imageUrl ? [`${siteUrl}/api/og/${profile.slug}.png`] : undefined,
    lastModified: new Date(profile.addedAt),
    priority: 0.6,
    url: `${siteUrl}/${profile.slug}`,
  }));

  const organizationUrls = getAllOrganizations().map((org) => ({
    changeFrequency: "monthly" as const,
    lastModified: new Date(),
    priority: 0.4,
    url: `${siteUrl}/organizations/${org.slug}`,
  }));

  const tagUrls = allTags.map((tag) => ({
    changeFrequency: "weekly" as const,
    lastModified: new Date(),
    priority: 0.5,
    url: `${siteUrl}/tags/${tag.slug}`,
  }));

  return [
    {
      changeFrequency: "daily",
      lastModified: new Date(),
      priority: 1,
      url: siteUrl,
    },
    {
      changeFrequency: "daily",
      lastModified: new Date(),
      priority: 0.8,
      url: `${siteUrl}/archive`,
    },
    {
      changeFrequency: "weekly",
      lastModified: new Date(),
      priority: 0.7,
      url: `${siteUrl}/discover`,
    },
    {
      changeFrequency: "weekly",
      lastModified: new Date(),
      priority: 0.7,
      url: `${siteUrl}/tags`,
    },
    {
      changeFrequency: "weekly",
      lastModified: new Date(),
      priority: 0.6,
      url: `${siteUrl}/about`,
    },
    ...[
      "alumni",
      "contributors",
      "organizations",
      "contribute",
      "data",
      "about/editorial-policy",
    ].map((path) => ({
      changeFrequency: "weekly" as const,
      lastModified: new Date(),
      priority: 0.6,
      url: `${siteUrl}/${path}`,
    })),
    ...profileUrls,
    ...organizationUrls,
    ...tagUrls,
  ];
}
