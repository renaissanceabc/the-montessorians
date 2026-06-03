import {
  and,
  asc,
  type Column,
  count,
  db,
  desc,
  eq,
  ilike,
  inArray,
  lte,
  type SQL,
  sql,
} from "@repo/database";
import { dailyFeature, links, profiles, profileTags, tags } from "@repo/database/schema";
import type { Link, Profile as ProfileRow, Tag } from "@repo/database/types";
import { cacheLife, cacheTag } from "next/cache";
import { type getProfilesOptions, PROFILES_DEFAULTS } from "@/lib/types";

type ProfileResponse = Pick<
  ProfileRow,
  | "slug"
  | "name"
  | "tagline"
  | "bio"
  | "notableAchievements"
  | "education"
  | "educationNotes"
  | "quotes"
  | "imageUrl"
> & {
  tags: Pick<Tag, "slug" | "label">[];
  links: Pick<Link, "url" | "type">[];
};

function buildOrderClause(orderBy: string, sortBy: string) {
  const column: Column = orderBy === "alphabetical" ? profiles.name : profiles.createdAt;
  return sortBy === "asc" ? [asc(column)] : [desc(column)];
}

/**
 * Get all profiles directly from database (for server components)
 */
export async function getProfilesFromDB(options: getProfilesOptions = {}) {
  "use cache";
  cacheTag("profiles");
  cacheLife("days");
  const {
    limit,
    page,
    orderBy,
    sortBy,
    search,
    tags: tagsParam,
  } = {
    ...PROFILES_DEFAULTS,
    ...options,
  };

  const orderClause = buildOrderClause(orderBy, sortBy);
  const offset = (page - 1) * limit;

  // If filtering by tags, first get the profile slugs that have those tags
  let filteredProfileSlugs: string[] | null = null;
  if (tagsParam) {
    const tagSlugs = tagsParam.split(",");
    const profilesWithTags = await db
      .selectDistinct({ profileSlug: profileTags.profileSlug })
      .from(profileTags)
      .where(inArray(profileTags.tagSlug, tagSlugs));

    filteredProfileSlugs = profilesWithTags.map((p) => p.profileSlug);

    // If no profiles have the requested tags, return empty result
    if (filteredProfileSlugs.length === 0) {
      return {
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          hasMore: false,
        },
      };
    }
  }

  // Build the where conditions
  const conditions: SQL[] = [];
  if (search) {
    conditions.push(ilike(profiles.name, `%${search}%`));
  }
  if (filteredProfileSlugs) {
    conditions.push(inArray(profiles.slug, filteredProfileSlugs));
  }

  // Get total count for pagination
  const totalResult = await db
    .select({ count: count() })
    .from(profiles)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  const total = Number(totalResult[0]?.count || 0);

  // If no profiles found, return empty result
  if (total === 0) {
    return {
      data: [],
      pagination: {
        total: 0,
        page,
        limit,
        hasMore: false,
      },
    };
  }

  // Get only the paginated profiles with LIMIT/OFFSET at database level
  const matchingProfiles =
    conditions.length > 0
      ? await db
          .select()
          .from(profiles)
          .where(and(...conditions))
          .orderBy(...orderClause)
          .limit(limit)
          .offset(offset)
      : await db
          .select()
          .from(profiles)
          .orderBy(...orderClause)
          .limit(limit)
          .offset(offset);

  // Get tags and links only for the paginated profiles
  const profileSlugs = matchingProfiles.map((p) => p.slug);
  const allTags = await db
    .select({
      profileSlug: profileTags.profileSlug,
      tagSlug: tags.slug,
      tagLabel: tags.label,
    })
    .from(profileTags)
    .innerJoin(tags, eq(profileTags.tagSlug, tags.slug))
    .where(inArray(profileTags.profileSlug, profileSlugs));

  const allLinks = await db
    .select({
      profileSlug: links.profileSlug,
      type: links.type,
      url: links.url,
    })
    .from(links)
    .where(inArray(links.profileSlug, profileSlugs));

  // Group profiles with their tags while preserving order
  const profilesMap = new Map<string, ProfileResponse>();
  const orderedSlugs: string[] = [];

  // Create a map of tags by profile slug for quick lookup
  const tagsByProfile = new Map<string, Array<{ slug: string; label: string }>>();
  for (const tag of allTags) {
    const existingTags = tagsByProfile.get(tag.profileSlug) || [];
    existingTags.push({
      slug: tag.tagSlug,
      label: tag.tagLabel,
    });
    tagsByProfile.set(tag.profileSlug, existingTags);
  }

  // Create a map of links by profile slug for quick lookup
  const linksByProfile = new Map<string, Pick<Link, "type" | "url">[]>();
  for (const link of allLinks) {
    const existingLinks = linksByProfile.get(link.profileSlug) || [];
    existingLinks.push({
      type: link.type,
      url: link.url,
    });
    linksByProfile.set(link.profileSlug, existingLinks);
  }

  // Build the profile responses with all their tags and links
  for (const profile of matchingProfiles) {
    orderedSlugs.push(profile.slug);
    profilesMap.set(profile.slug, {
      slug: profile.slug,
      name: profile.name,
      tagline: profile.tagline,
      bio: profile.bio,
      education: profile.education,
      educationNotes: profile.educationNotes,
      notableAchievements: profile.notableAchievements,
      quotes: profile.quotes,
      imageUrl: profile.imageUrl,
      tags: tagsByProfile.get(profile.slug) || [],
      links: linksByProfile.get(profile.slug) || [],
    });
  }

  // Convert to array preserving the SQL order (already paginated)
  const paginatedProfiles = orderedSlugs
    .map((slug) => profilesMap.get(slug))
    .filter((profile): profile is ProfileResponse => profile !== undefined);

  return {
    data: paginatedProfiles,
    pagination: {
      total,
      page,
      limit,
      hasMore: offset + limit < total,
    },
  };
}

/**
 * Get a profile with adjacent profiles (for API routes and navigation)
 */
export async function getProfileWithAdjacentFromDB(slug: string) {
  "use cache";
  cacheTag("profiles", `profile-${slug}`);
  cacheLife("days");
  // Get profile with tags and links in a single query using LEFT JOINs
  const profileWithRelations = await db
    .select({
      // Profile fields
      profileSlug: profiles.slug,
      profileName: profiles.name,
      profileTagline: profiles.tagline,
      profileBio: profiles.bio,
      profileEducationNotes: profiles.educationNotes,
      profileEducation: profiles.education,
      profileNotableAchievements: profiles.notableAchievements,
      profileQuotes: profiles.quotes,
      profileImageUrl: profiles.imageUrl,
      // Tag fields (nullable)
      tagSlug: tags.slug,
      tagLabel: tags.label,
      // Link fields (nullable)
      linkType: links.type,
      linkUrl: links.url,
    })
    .from(profiles)
    .leftJoin(profileTags, eq(profiles.slug, profileTags.profileSlug))
    .leftJoin(tags, eq(profileTags.tagSlug, tags.slug))
    .leftJoin(links, eq(profiles.slug, links.profileSlug))
    .where(eq(profiles.slug, slug));

  if (profileWithRelations.length === 0) {
    return null;
  }

  // Use the SQL function for efficient adjacent profile lookup
  // The function returns exactly what we need in a single query
  const adjacentRows = await db.execute(sql`SELECT * FROM get_adjacent_profiles(${slug})`);

  if (!adjacentRows || adjacentRows.length === 0) {
    return null;
  }

  // Extract adjacent profile data with explicit typing
  const row = adjacentRows[0] as {
    previous_slug: string | null;
    previous_name: string | null;
    next_slug: string | null;
    next_name: string | null;
  };
  if (!row) {
    return null;
  }

  // Use explicit property access with fallbacks
  const previous_slug = (row.previous_slug ?? null) as string | null;
  const previous_name = (row.previous_name ?? null) as string | null;
  const next_slug = (row.next_slug ?? null) as string | null;
  const next_name = (row.next_name ?? null) as string | null;

  // Extract profile data (same for all rows)
  const firstRow = profileWithRelations[0];
  const profileData = {
    slug: firstRow.profileSlug,
    name: firstRow.profileName,
    tagline: firstRow.profileTagline,
    bio: firstRow.profileBio,
    educationNotes: firstRow.profileEducationNotes,
    education: firstRow.profileEducation,
    notableAchievements: firstRow.profileNotableAchievements,
    quotes: firstRow.profileQuotes,
    imageUrl: firstRow.profileImageUrl,
  };

  // Aggregate tags and links from all rows (handle Cartesian product from JOINs)
  const tagsSet = new Map<string, { slug: string; label: string }>();
  const linksMap = new Map<string, Pick<Link, "type" | "url">>();

  for (const relationRow of profileWithRelations) {
    if (relationRow.tagSlug && relationRow.tagLabel) {
      tagsSet.set(relationRow.tagSlug, {
        slug: relationRow.tagSlug,
        label: relationRow.tagLabel,
      });
    }
    if (relationRow.linkType && relationRow.linkUrl) {
      // Use type+url as unique key to avoid duplicates from Cartesian product
      const linkKey = `${relationRow.linkType}:${relationRow.linkUrl}`;
      if (!linksMap.has(linkKey)) {
        linksMap.set(linkKey, {
          type: relationRow.linkType as Link["type"],
          url: relationRow.linkUrl,
        });
      }
    }
  }

  // Convert to arrays
  const validTags = Array.from(tagsSet.values());
  const linksResult = Array.from(linksMap.values());

  const profile = {
    ...profileData,
    tags: validTags,
    links: linksResult,
  };

  return {
    profile,
    previous: {
      slug: previous_slug,
      name: previous_name,
    },
    next: {
      slug: next_slug,
      name: next_name,
    },
  };
}

/**
 * Helper function to get Eastern date (EST/EDT aware)
 * Uses Intl API for accurate timezone conversion
 */
export function getEasternDateForFeature() {
  const now = new Date();
  // Use Intl API to get date in Eastern timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

/**
 * Get past profiles from daily features (for server components and API routes)
 */
export async function getPastProfilesFromDB(today: string, options: getProfilesOptions = {}) {
  "use cache";
  cacheTag("profiles", "past-profiles", `past-profiles-${today}`);
  cacheLife("days");
  const { limit, page } = {
    ...PROFILES_DEFAULTS,
    ...options,
  };

  const offset = (page - 1) * limit;

  // Get profile slugs + dates from daily features
  const featuredSlugs = await db
    .select({
      profileSlug: dailyFeature.profileSlug,
      date: dailyFeature.date,
    })
    .from(dailyFeature)
    .where(lte(dailyFeature.date, today))
    .orderBy(desc(dailyFeature.date))
    .limit(limit)
    .offset(offset);

  if (featuredSlugs.length === 0) {
    return {
      data: [],
      pagination: {
        total: 0,
        page,
        limit,
        hasMore: false,
      },
    };
  }

  const slugs = featuredSlugs.map((f) => f.profileSlug);

  // Get full profile data with tags and links in a single query using LEFT JOINs
  const rawResults = await db
    .select({
      slug: profiles.slug,
      name: profiles.name,
      tagline: profiles.tagline,
      bio: profiles.bio,
      education: profiles.education,
      educationNotes: profiles.educationNotes,
      notableAchievements: profiles.notableAchievements,
      quotes: profiles.quotes,
      imageUrl: profiles.imageUrl,
      tag: {
        slug: tags.slug,
        label: tags.label,
      },
      linkType: links.type,
      linkUrl: links.url,
    })
    .from(profiles)
    .leftJoin(profileTags, eq(profiles.slug, profileTags.profileSlug))
    .leftJoin(tags, eq(profileTags.tagSlug, tags.slug))
    .leftJoin(links, eq(profiles.slug, links.profileSlug))
    .where(inArray(profiles.slug, slugs));

  // Group by profile and maintain order (handle Cartesian product from JOINs)
  const profilesMap = new Map<string, ProfileResponse>();

  for (const row of rawResults) {
    const existing = profilesMap.get(row.slug);
    const tag = row.tag?.label ? { slug: row.tag.slug, label: row.tag.label } : null;

    if (existing) {
      // Add tag if not already present
      if (tag && !existing.tags.some((t) => t.slug === tag.slug)) {
        existing.tags.push(tag);
      }
      // Add link if not already present
      if (row.linkType && row.linkUrl) {
        const linkKey = `${row.linkType}:${row.linkUrl}`;
        if (!existing.links.some((l) => `${l.type}:${l.url}` === linkKey)) {
          existing.links.push({
            type: row.linkType as Link["type"],
            url: row.linkUrl,
          });
        }
      }
    } else {
      // Create new profile entry
      const initialLinks: Pick<Link, "type" | "url">[] = [];
      if (row.linkType && row.linkUrl) {
        initialLinks.push({
          type: row.linkType as Link["type"],
          url: row.linkUrl,
        });
      }

      profilesMap.set(row.slug, {
        slug: row.slug,
        name: row.name,
        tagline: row.tagline,
        bio: row.bio,
        education: row.education,
        educationNotes: row.educationNotes,
        notableAchievements: row.notableAchievements,
        quotes: row.quotes,
        imageUrl: row.imageUrl,
        tags: tag ? [tag] : [],
        links: initialLinks,
      });
    }
  }

  // Sort by original featured order
  const sortedProfiles = slugs
    .map((slug) => profilesMap.get(slug))
    .filter((p): p is ProfileResponse => p !== undefined);

  // Add featured dates
  const profilesWithDates = sortedProfiles.map((profile) => {
    const featured = featuredSlugs.find((f) => f.profileSlug === profile.slug);
    return {
      ...profile,
      featuredDate: featured?.date || "",
    };
  });

  // Check if there are more results
  const totalCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(dailyFeature)
    .where(lte(dailyFeature.date, today));

  const total = Number(totalCount[0]?.count || 0);
  const hasMore = offset + limit < total;

  return {
    data: profilesWithDates,
    pagination: {
      total,
      page,
      limit,
      hasMore,
    },
  };
}

/**
 * Get today's daily profile from daily features table (for server components and API routes)
 * @param today Date string in YYYY-MM-DD format. Must be provided by caller so it becomes part of the cache key.
 */
export async function getDailyProfileFromFeatureDB(today: string) {
  "use cache";
  cacheTag("profiles", "daily-profile", `daily-profile-${today}`);
  cacheLife("days");

  // Get profile with tags and links in a single query using LEFT JOINs
  const profileWithRelations = await db
    .select({
      // Profile fields
      profileSlug: profiles.slug,
      profileName: profiles.name,
      profileTagline: profiles.tagline,
      profileBio: profiles.bio,
      profileEducationNotes: profiles.educationNotes,
      profileEducation: profiles.education,
      profileNotableAchievements: profiles.notableAchievements,
      profileQuotes: profiles.quotes,
      profileImageUrl: profiles.imageUrl,
      // Tag fields (nullable)
      tagSlug: tags.slug,
      tagLabel: tags.label,
      // Link fields (nullable)
      linkType: links.type,
      linkUrl: links.url,
    })
    .from(dailyFeature)
    .innerJoin(profiles, eq(dailyFeature.profileSlug, profiles.slug))
    .leftJoin(profileTags, eq(profiles.slug, profileTags.profileSlug))
    .leftJoin(tags, eq(profileTags.tagSlug, tags.slug))
    .leftJoin(links, eq(profiles.slug, links.profileSlug))
    .where(eq(dailyFeature.date, today));

  if (profileWithRelations.length === 0) {
    return null;
  }

  // Extract profile data (same for all rows)
  const firstRow = profileWithRelations[0];
  const profile = {
    slug: firstRow.profileSlug,
    name: firstRow.profileName,
    tagline: firstRow.profileTagline,
    bio: firstRow.profileBio,
    educationNotes: firstRow.profileEducationNotes,
    education: firstRow.profileEducation,
    notableAchievements: firstRow.profileNotableAchievements,
    quotes: firstRow.profileQuotes,
    imageUrl: firstRow.profileImageUrl,
  };

  // Aggregate tags and links from all rows (handle Cartesian product from JOINs)
  const tagsSet = new Map<string, { slug: string; label: string }>();
  const linksMap = new Map<string, Pick<Link, "type" | "url">>();

  for (const row of profileWithRelations) {
    if (row.tagSlug && row.tagLabel) {
      tagsSet.set(row.tagSlug, {
        slug: row.tagSlug,
        label: row.tagLabel,
      });
    }
    if (row.linkType && row.linkUrl) {
      // Use type+url as unique key to avoid duplicates from Cartesian product
      const linkKey = `${row.linkType}:${row.linkUrl}`;
      if (!linksMap.has(linkKey)) {
        linksMap.set(linkKey, {
          type: row.linkType as Link["type"],
          url: row.linkUrl,
        });
      }
    }
  }

  // Convert to arrays
  const validTags = Array.from(tagsSet.values());
  const linksResult = Array.from(linksMap.values());

  return {
    ...profile,
    tags: validTags,
    links: linksResult,
  };
}
