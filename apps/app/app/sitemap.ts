import type { MetadataRoute } from "next";
import { getAllOrganizations } from "@/lib/content/organizations";
import { getAllProfiles, getAllTags } from "@/lib/content/profiles";
import { siteUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const allProfiles = getAllProfiles();
  const allTags = getAllTags().data;

  const profileUrls = allProfiles.map((profile) => ({
    url: `${siteUrl}/${profile.slug}`,
    lastModified: new Date(profile.addedAt),
    changeFrequency: "weekly" as const,
    priority: 0.6,
    images: profile.imageUrl ? [`${siteUrl}/api/og/${profile.slug}.png`] : undefined,
  }));

  const organizationUrls = getAllOrganizations().map((org) => ({
    url: `${siteUrl}/organizations/${org.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.4,
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
    ...["contributors", "organizations", "contribute", "data"].map((path) => ({
      url: `${siteUrl}/${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...profileUrls,
    ...organizationUrls,
    ...tagUrls,
  ];
}
