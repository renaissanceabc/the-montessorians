// Filter option shapes for the DB helpers. Response shapes live in trpc/types.ts
// and are inferred from the router.

export type getProfilesOptions = {
  limit?: number;
  page?: number;
  orderBy?: "latest" | "trending" | "alphabetical" | "contributions";
  sortBy?: "asc" | "desc";
  search?: string;
  tags?: string;
  /** alum | contributor */
  kind?: "alum" | "contributor";
  /** Comma-separated contributor roles */
  roles?: string;
  /** Comma-separated organization slugs (affiliations or schools) */
  organizations?: string;
  /** Only people with at least this many documented contributions */
  minContributions?: number;
};

export type getTagsOptions = {
  orderBy?: "alphabetical";
  sortBy?: "asc" | "desc";
};

export const PROFILES_DEFAULTS: Required<
  Pick<getProfilesOptions, "limit" | "page" | "orderBy" | "sortBy" | "tags">
> = {
  limit: 10,
  page: 1,
  orderBy: "latest",
  sortBy: "desc",
  tags: "",
};

export const DEFAULT_PROFILES_FILTERS: Pick<getProfilesOptions, "orderBy" | "sortBy"> = {
  orderBy: "latest",
  sortBy: "desc",
};

export const DEFAULT_TAGS_FILTERS: Pick<getTagsOptions, "orderBy" | "sortBy"> = {
  orderBy: "alphabetical",
  sortBy: "asc",
};

export const TAGS_DEFAULTS: Required<getTagsOptions> = {
  orderBy: "alphabetical",
  sortBy: "asc",
};
