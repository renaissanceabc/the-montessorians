import type { getProfilesOptions } from "@/lib/types";

import type { Profile } from "./types";

// Pure, isomorphic filtering/sorting over an in-memory profile list. Shared by
// the server content layer (getProfiles) and the client discover page.

const splitList = (value: string | undefined) => (value ?? "").split(",").filter(Boolean);

const sortProfiles = (
  list: Profile[],
  orderBy: NonNullable<getProfilesOptions["orderBy"]>,
  sortBy: NonNullable<getProfilesOptions["sortBy"]>
): Profile[] => {
  const dir = sortBy === "asc" ? 1 : -1;
  return list.toSorted((a, b) => {
    if (orderBy === "alphabetical") {
      return a.name.localeCompare(b.name) * dir;
    }
    if (orderBy === "contributions") {
      const diff = a.contributions.length - b.contributions.length;
      return diff === 0 ? a.name.localeCompare(b.name) : diff * dir;
    }
    // "latest" / "trending" → by when the profile was added, ties A–Z either way
    if (a.addedAt === b.addedAt) {
      return a.name.localeCompare(b.name);
    }
    return (a.addedAt < b.addedAt ? -1 : 1) * dir;
  });
};

const COMBINING_MARKS = /[̀-ͯ]/gu;

/** Lowercase and strip accents, so "jose" finds "José". */
export const normalizeSearch = (s: string): string =>
  s.normalize("NFKD").replaceAll(COMBINING_MARKS, "").toLowerCase().trim();

/** How well a profile matches a search: by name first, then by anything else. */
type SearchRank = "name" | "other" | null;

const nameFields = (p: Profile): (string | null)[] => [p.name, p.nameAuthorized, ...p.nameVariants];

const otherFields = (p: Profile): (string | null | undefined)[] => [
  p.tagline,
  ...p.tags.map((t) => t.label),
  ...[...p.schools, ...p.affiliations].flatMap((ref) => [
    ref.organizationName,
    ref.organizationShortName,
    ...(ref.organizationNameVariants ?? []),
  ]),
];

const includesQuery = (q: string) => (field: string | null | undefined) =>
  Boolean(field && normalizeSearch(field).includes(q));

export const searchRank = (profile: Profile, query: string): SearchRank => {
  const q = normalizeSearch(query);
  if (!q) {
    return "name";
  }
  if (nameFields(profile).some(includesQuery(q))) {
    return "name";
  }
  if (otherFields(profile).some(includesQuery(q))) {
    return "other";
  }
  return null;
};

export const filterAndSortProfiles = (
  list: Profile[],
  options: getProfilesOptions = {}
): Profile[] => {
  const {
    orderBy = "latest",
    sortBy = "desc",
    search,
    tags,
    kind,
    roles,
    organizations,
    minContributions,
    limit,
  } = options;

  let out = list;

  if (kind) {
    out = out.filter((p) => p.kinds.includes(kind));
  }

  // Search matches names (including authorized names and variants), taglines,
  // tag labels, and organization names. Name matches rank first.
  const ranks = new Map<string, SearchRank>();
  if (search) {
    for (const p of out) {
      ranks.set(p.slug, searchRank(p, search));
    }
    out = out.filter((p) => ranks.get(p.slug) !== null);
  }

  const wantedTags = splitList(tags);
  if (wantedTags.length > 0) {
    out = out.filter((p) => p.tags.some((t) => wantedTags.includes(t.slug)));
  }

  const wantedRoles = splitList(roles);
  if (wantedRoles.length > 0) {
    out = out.filter((p) => p.roles.some((r) => wantedRoles.includes(r)));
  }

  const wantedOrgs = splitList(organizations);
  if (wantedOrgs.length > 0) {
    out = out.filter((p) =>
      [...p.affiliations, ...p.schools].some((a) => wantedOrgs.includes(a.organization))
    );
  }

  if (minContributions && minContributions > 0) {
    out = out.filter((p) => p.contributions.length >= minContributions);
  }

  out = sortProfiles(out, orderBy, sortBy);

  if (search) {
    // Stable: the chosen sort order holds within each group.
    out = [
      ...out.filter((p) => ranks.get(p.slug) === "name"),
      ...out.filter((p) => ranks.get(p.slug) === "other"),
    ];
  }

  if (limit && limit > 0) {
    out = out.slice(0, limit);
  }

  return out;
};
