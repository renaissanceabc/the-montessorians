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

// enrich is split in two so each half stays readable; the halves are spread in
// order, so the Profile's keys keep their alphabetical order.
const enrichIdentity = (raw: RawProfile) => {
  const kinds = [raw.kind ?? "alum"].flat();
  return {
    addedAt: raw.addedAt,
    affiliations: raw.affiliations ?? [],
    bio: raw.bio ?? null,
    birthYear: raw.birthYear ?? null,
    contributions: raw.contributions ?? [],
    deathYear: raw.deathYear ?? null,
    education: raw.education ?? [],
    educationNotes: raw.educationNotes ?? null,
    glossaryCitations: raw.glossaryCitations ?? [],
    id: raw.id,
    identifiers: raw.identifiers ?? {},
    imageCredit: raw.imageCredit ?? null,
    imageUrl: raw.imageUrl ?? null,
    kind: kinds.includes("contributor") ? ("contributor" as const) : ("alum" as const),
    kinds,
  };
};

const enrichDetails = (raw: RawProfile) => ({
  links: raw.links ?? [],
  montessoriNotes: raw.montessoriNotes ?? null,
  name: raw.name,
  nameAuthorized: raw.nameAuthorized ?? null,
  nameVariants: raw.nameVariants ?? [],
  notableAchievements: raw.notableAchievements ?? [],
  pinned: raw.pinned ?? false,
  quotes: raw.quotes ?? [],
  related: raw.related ?? [],
  roles: raw.roles ?? [],
  schools: raw.schools ?? [],
  slug: raw.slug,
  sources: raw.sources ?? [],
  status: raw.status ?? "provisional",
  tagline: raw.tagline ?? null,
  tags: (raw.tags ?? []).map((slug) => ({ label: toTitleCase(slug), slug })),
  verification: raw.verification ?? null,
});

const enrich = (raw: RawProfile): Profile => ({ ...enrichIdentity(raw), ...enrichDetails(raw) });

// Parsed + enriched once at module load (build time). `profiles.generated.json`
// is produced by scripts/generate-content.mjs and is already sorted by name.
// SAFETY: profiles.generated.json is written by scripts/generate-content.mjs from
// data/people, which scripts/validate.js checks against the RawProfile shape.
const ALL: Profile[] = (rawProfiles as RawProfile[]).map(enrich);
const BY_SLUG = new Map(ALL.map((p) => [p.slug, p]));
const BY_ID = new Map(ALL.map((p) => [p.id, p]));

export const getAllProfiles = (kind?: ProfileKind): Profile[] =>
  kind ? ALL.filter((p) => p.kinds.includes(kind)) : ALL;

const INVERSE: Record<RawRelated["relation"], RawRelated["relation"]> = {
  advisee: "advisor",
  advisor: "advisee",
  child: "parent",
  colleague: "colleague",
  parent: "child",
  sibling: "sibling",
  spouse: "spouse",
  trained: "trained_by",
  trained_by: "trained",
};

/** Contributions count as shared when their DOI, ISBN, or title matches. */
const contributionKey = (c: Profile["contributions"][number]) =>
  c.doi ?? c.isbn ?? c.title.toLowerCase();

/**
 * Everyone related to a person: relationships recorded on either side (the
 * other side is inferred), plus co-authors derived from shared DOIs/titles.
 */
export const getRelatedPeople = (profile: Profile): RelatedPerson[] => {
  const out = new Map<string, RelatedPerson>();
  const add = (
    other: Profile,
    relation: RelatedPerson["relation"],
    extra: Partial<RelatedPerson> = {}
  ) => {
    const key = `${other.slug}:${relation}`;
    if (!out.has(key)) {
      out.set(key, {
        imageUrl: other.imageUrl,
        name: other.name,
        relation,
        slug: other.slug,
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
    const mine = new Set(profile.contributions.map(contributionKey));
    const shared = other.contributions.filter((c) => mine.has(contributionKey(c))).length;
    if (shared > 0) {
      add(other, "coauthor", { count: shared });
    }
  }
  return [...out.values()];
};

export const getProfileById = (id: string): Profile | null => BY_ID.get(id) ?? null;

export const getProfileBySlug = (slug: string): Profile | null => BY_SLUG.get(slug) ?? null;

export const getAllSlugs = (): string[] => ALL.map((p) => p.slug);

/**
 * Filter + sort profiles in memory. Mirrors the old getProfilesFromDB query
 * surface (search by name, filter by comma-separated tag slugs, sort), minus
 * pagination — the full set is tiny and rendered at once.
 */
export const getProfiles = (options: getProfilesOptions = {}): Profile[] =>
  filterAndSortProfiles(ALL, options);

export const getProfileWithAdjacent = (slug: string): ProfilePage | null => {
  const profile = BY_SLUG.get(slug);
  if (!profile) {
    return null;
  }

  // Neighbors follow the alphabetical display order (ALL is sorted by name),
  // within the same collection (alumni or contributors).
  const siblings = ALL.filter((p) => p.kinds.includes(profile.kind));
  const idx = siblings.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx !== -1 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return {
    next: next
      ? { imageUrl: next.imageUrl, name: next.name, slug: next.slug }
      : { imageUrl: null, name: null, slug: null },
    previous: prev
      ? { imageUrl: prev.imageUrl, name: prev.name, slug: prev.slug }
      : { imageUrl: null, name: null, slug: null },
    profile,
  };
};

export const getProfilesByTag = (tagSlug: string): Profile[] =>
  ALL.filter((p) => p.tags.some((t) => t.slug === tagSlug));

/** A sorted tag listing, as returned by the tag helpers below. */
export interface TagList<T> {
  data: T[];
}

export const getAllTags = (options: getTagsOptions = {}, kind?: ProfileKind): TagList<Tag> => {
  const map = new Map<string, string>();
  for (const p of getAllProfiles(kind)) {
    for (const t of p.tags) {
      map.set(t.slug, t.label);
    }
  }
  const dir = options.sortBy === "desc" ? -1 : 1;
  const data = [...map]
    .map(([slug, label]) => ({ label, slug }))
    .toSorted((a, b) => a.label.localeCompare(b.label) * dir);
  return { data };
};

export const getTagsWithCounts = (options: getTagsOptions = {}): TagList<TagWithCount> => {
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
    .map(([slug, { label, profileCount }]) => ({ label, profileCount, slug }))
    .toSorted((a, b) => a.label.localeCompare(b.label) * dir);
  return { data };
};

export const getTagBySlug = (slug: string): Tag | null =>
  getAllTags().data.find((t) => t.slug === slug) ?? null;
