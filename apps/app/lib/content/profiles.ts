import type { getProfilesOptions, getTagsOptions } from "@/lib/types";
import { toTitleCase } from "@/lib/utils";
import { filterAndSortProfiles } from "./filter";
import rawProfiles from "./profiles.generated.json";
import type { Profile, ProfilePage, RawProfile, Tag, TagWithCount } from "./types";

function enrich(raw: RawProfile): Profile {
  return {
    slug: raw.slug,
    name: raw.name,
    tagline: raw.tagline ?? null,
    bio: raw.bio ?? null,
    education: raw.education ?? [],
    educationNotes: raw.educationNotes ?? null,
    notableAchievements: raw.notableAchievements ?? [],
    quotes: raw.quotes ?? [],
    imageUrl: raw.imageUrl ?? null,
    tags: (raw.tags ?? []).map((slug) => ({ slug, label: toTitleCase(slug) })),
    links: raw.links ?? [],
    addedAt: raw.addedAt,
  };
}

// Parsed + enriched once at module load (build time). `profiles.generated.json`
// is produced by scripts/generate-content.mjs and is already sorted by name.
const ALL: Profile[] = (rawProfiles as RawProfile[]).map(enrich);
const BY_SLUG = new Map(ALL.map((p) => [p.slug, p]));

export function getAllProfiles(): Profile[] {
  return ALL;
}

export function getProfileBySlug(slug: string): Profile | null {
  return BY_SLUG.get(slug) ?? null;
}

export function getAllSlugs(): string[] {
  return ALL.map((p) => p.slug);
}

/**
 * Filter + sort profiles in memory. Mirrors the old getProfilesFromDB query
 * surface (search by name, filter by comma-separated tag slugs, sort), minus
 * pagination — the full set is tiny and rendered at once.
 */
export function getProfiles(options: getProfilesOptions = {}): Profile[] {
  return filterAndSortProfiles(ALL, options);
}

export function getProfileWithAdjacent(slug: string): ProfilePage | null {
  const profile = BY_SLUG.get(slug);
  if (!profile) {
    return null;
  }

  // Neighbors follow the alphabetical display order (ALL is sorted by name).
  const idx = ALL.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? ALL[idx - 1] : null;
  const next = idx >= 0 && idx < ALL.length - 1 ? ALL[idx + 1] : null;

  return {
    profile,
    previous: prev ? { slug: prev.slug, name: prev.name } : { slug: null, name: null },
    next: next ? { slug: next.slug, name: next.name } : { slug: null, name: null },
  };
}

export function getProfilesByTag(tagSlug: string): Profile[] {
  return ALL.filter((p) => p.tags.some((t) => t.slug === tagSlug));
}

export function getAllTags(options: getTagsOptions = {}): { data: Tag[] } {
  const map = new Map<string, string>();
  for (const p of ALL) {
    for (const t of p.tags) {
      map.set(t.slug, t.label);
    }
  }
  const dir = options.sortBy === "desc" ? -1 : 1;
  const data = [...map]
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => a.label.localeCompare(b.label) * dir);
  return { data };
}

export function getTagsWithCounts(options: getTagsOptions = {}): { data: TagWithCount[] } {
  const counts = new Map<string, { label: string; profileCount: number }>();
  for (const p of ALL) {
    for (const t of p.tags) {
      const existing = counts.get(t.slug) ?? { label: t.label, profileCount: 0 };
      existing.profileCount += 1;
      counts.set(t.slug, existing);
    }
  }
  const dir = options.sortBy === "desc" ? -1 : 1;
  const data = [...counts]
    .map(([slug, { label, profileCount }]) => ({ slug, label, profileCount }))
    .sort((a, b) => a.label.localeCompare(b.label) * dir);
  return { data };
}

export function getTagBySlug(slug: string): Tag | null {
  return getAllTags().data.find((t) => t.slug === slug) ?? null;
}
