import type { getProfilesOptions, getTagsOptions } from "@/lib/types";
import { toTitleCase } from "@/lib/utils";
import { filterAndSortProfiles } from "./filter";
import rawProfiles from "./profiles.generated.json";
import type {
  Profile,
  ProfileKind,
  ProfilePage,
  RawProfile,
  RawRelated,
  RelatedPerson,
  Tag,
  TagWithCount,
} from "./types";

function enrich(raw: RawProfile): Profile {
  const kinds = [raw.kind ?? "alum"].flat();
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    kind: kinds.includes("contributor") ? "contributor" : "alum",
    kinds,
    roles: raw.roles ?? [],
    pinned: raw.pinned ?? false,
    nameAuthorized: raw.nameAuthorized ?? null,
    nameVariants: raw.nameVariants ?? [],
    birthYear: raw.birthYear ?? null,
    deathYear: raw.deathYear ?? null,
    tagline: raw.tagline ?? null,
    bio: raw.bio ?? null,
    education: raw.education ?? [],
    educationNotes: raw.educationNotes ?? null,
    schools: raw.schools ?? [],
    montessoriNotes: raw.montessoriNotes ?? null,
    affiliations: raw.affiliations ?? [],
    contributions: raw.contributions ?? [],
    notableAchievements: raw.notableAchievements ?? [],
    quotes: raw.quotes ?? [],
    sources: raw.sources ?? [],
    verification: raw.verification ?? null,
    status: raw.status ?? "provisional",
    identifiers: raw.identifiers ?? {},
    glossaryCitations: raw.glossaryCitations ?? [],
    related: raw.related ?? [],
    imageCredit: raw.imageCredit ?? null,
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
const BY_ID = new Map(ALL.map((p) => [p.id, p]));

export function getAllProfiles(kind?: ProfileKind): Profile[] {
  return kind ? ALL.filter((p) => p.kinds.includes(kind)) : ALL;
}

const INVERSE: Record<RawRelated["relation"], RawRelated["relation"]> = {
  parent: "child",
  child: "parent",
  sibling: "sibling",
  spouse: "spouse",
  trained_by: "trained",
  trained: "trained_by",
  advisor: "advisee",
  advisee: "advisor",
  colleague: "colleague",
};

/**
 * Everyone related to a person: relationships recorded on either side (the
 * other side is inferred), plus co-authors derived from shared DOIs/titles.
 */
export function getRelatedPeople(profile: Profile): RelatedPerson[] {
  const out = new Map<string, RelatedPerson>();
  const add = (
    other: Profile,
    relation: RelatedPerson["relation"],
    extra: Partial<RelatedPerson> = {}
  ) => {
    const key = `${other.slug}:${relation}`;
    if (!out.has(key)) {
      out.set(key, {
        slug: other.slug,
        name: other.name,
        imageUrl: other.imageUrl,
        relation,
        ...extra,
      });
    }
  };
  for (const rel of profile.related) {
    const other = BY_SLUG.get(rel.person);
    if (other) {
      add(other, rel.relation, { source: rel.source });
    }
  }
  for (const other of ALL) {
    if (other.slug === profile.slug) {
      continue;
    }
    for (const rel of other.related) {
      if (rel.person === profile.slug) {
        add(other, INVERSE[rel.relation], { source: rel.source });
      }
    }
    const key = (c: Profile["contributions"][number]) => c.doi ?? c.isbn ?? c.title.toLowerCase();
    const mine = new Set(profile.contributions.map(key));
    const shared = other.contributions.filter((c) => mine.has(key(c))).length;
    if (shared > 0) {
      add(other, "coauthor", { count: shared });
    }
  }
  return [...out.values()];
}

export function getProfileById(id: string): Profile | null {
  return BY_ID.get(id) ?? null;
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

  // Neighbors follow the alphabetical display order (ALL is sorted by name),
  // within the same collection (alumni or contributors).
  const siblings = ALL.filter((p) => p.kinds.includes(profile.kind));
  const idx = siblings.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return {
    profile,
    previous: prev ? { slug: prev.slug, name: prev.name } : { slug: null, name: null },
    next: next ? { slug: next.slug, name: next.name } : { slug: null, name: null },
  };
}

export function getProfilesByTag(tagSlug: string): Profile[] {
  return ALL.filter((p) => p.tags.some((t) => t.slug === tagSlug));
}

export function getAllTags(options: getTagsOptions = {}, kind?: ProfileKind): { data: Tag[] } {
  const map = new Map<string, string>();
  for (const p of getAllProfiles(kind)) {
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
