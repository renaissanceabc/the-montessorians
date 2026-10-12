import type { getProfilesOptions } from "@/lib/types";
import type { Profile } from "./types";

// Pure, isomorphic filtering/sorting over an in-memory profile list. Shared by
// the server content layer (getProfiles) and the client discover page.

const splitList = (value: string | undefined) => (value ?? "").split(",").filter(Boolean);

function sortProfiles(
  list: Profile[],
  orderBy: NonNullable<getProfilesOptions["orderBy"]>,
  sortBy: NonNullable<getProfilesOptions["sortBy"]>
): Profile[] {
  const dir = sortBy === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    if (orderBy === "alphabetical") {
      return a.name.localeCompare(b.name) * dir;
    }
    if (orderBy === "contributions") {
      const diff = a.contributions.length - b.contributions.length;
      return diff === 0 ? a.name.localeCompare(b.name) : diff * dir;
    }
    // "latest" / "trending" → by when the profile was added, pinned records first
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    if (a.pinned && b.pinned) {
      return a.name.localeCompare(b.name);
    }
    if (a.addedAt === b.addedAt) {
      return a.name.localeCompare(b.name) * dir;
    }
    return (a.addedAt < b.addedAt ? -1 : 1) * dir;
  });
}

function matchesSearch(profile: Profile, q: string): boolean {
  return [profile.name, profile.nameAuthorized, ...profile.nameVariants].some((name) =>
    name?.toLowerCase().includes(q)
  );
}

export function filterAndSortProfiles(
  list: Profile[],
  options: getProfilesOptions = {}
): Profile[] {
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

  if (search) {
    const q = search.toLowerCase();
    out = out.filter((p) => matchesSearch(p, q));
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

  if (limit && limit > 0) {
    out = out.slice(0, limit);
  }

  return out;
}
