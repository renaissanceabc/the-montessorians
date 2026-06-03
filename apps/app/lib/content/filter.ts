import type { getProfilesOptions } from "@/lib/types";
import type { Profile } from "./types";

// Pure, isomorphic filtering/sorting over an in-memory profile list. Shared by
// the server content layer (getProfiles) and the client discover page.

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
    // "latest" / "trending" → by when the profile was added
    if (a.addedAt === b.addedAt) {
      return a.name.localeCompare(b.name) * dir;
    }
    return (a.addedAt < b.addedAt ? -1 : 1) * dir;
  });
}

export function filterAndSortProfiles(
  list: Profile[],
  options: getProfilesOptions = {}
): Profile[] {
  const { orderBy = "latest", sortBy = "desc", search, tags, limit } = options;

  let out = list;

  if (search) {
    const q = search.toLowerCase();
    out = out.filter((p) => p.name.toLowerCase().includes(q));
  }

  if (tags) {
    const wanted = tags.split(",").filter(Boolean);
    if (wanted.length > 0) {
      out = out.filter((p) => p.tags.some((t) => wanted.includes(t.slug)));
    }
  }

  out = sortProfiles(out, orderBy, sortBy);

  if (limit && limit > 0) {
    out = out.slice(0, limit);
  }

  return out;
}
