import { asc, count, db, desc, eq, gt, type SQL } from "@repo/database";
import { profileTags, tags } from "@repo/database/schema";
import { cacheLife, cacheTag } from "next/cache";
import { type getTagsOptions, TAGS_DEFAULTS } from "@/lib/types";

function buildOrderClause(sortBy: string): SQL[] {
  return sortBy === "asc" ? [asc(tags.label)] : [desc(tags.label)];
}

/**
 * Get all tags directly from database (for server components and API routes)
 */
export async function getTagsFromDB(options: getTagsOptions = {}) {
  "use cache";
  cacheTag("tags");
  cacheLife("days");
  const { sortBy } = {
    ...TAGS_DEFAULTS,
    ...options,
  };

  const result = await db
    .select({
      slug: tags.slug,
      label: tags.label,
    })
    .from(tags)
    .orderBy(...buildOrderClause(sortBy));

  return {
    data: result,
  };
}

/**
 * Get a single tag by slug
 */
export async function getTagFromDB(slug: string) {
  "use cache";
  cacheTag("tags", `tag-${slug}`);
  cacheLife("days");
  const result = await db
    .select({
      slug: tags.slug,
      label: tags.label,
    })
    .from(tags)
    .where(eq(tags.slug, slug))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get all tags with their profile counts (excludes tags with no profiles)
 */
export async function getTagsWithCountsFromDB(options: getTagsOptions = {}) {
  "use cache";
  cacheTag("tags", "profiles");
  cacheLife("days");
  const { sortBy } = {
    ...TAGS_DEFAULTS,
    ...options,
  };

  const profileCount = count(profileTags.profileSlug);

  const result = await db
    .select({
      slug: tags.slug,
      label: tags.label,
      profileCount,
    })
    .from(tags)
    .leftJoin(profileTags, eq(tags.slug, profileTags.tagSlug))
    .groupBy(tags.slug, tags.label)
    .having(gt(profileCount, 0))
    .orderBy(...buildOrderClause(sortBy));

  return {
    data: result,
  };
}
