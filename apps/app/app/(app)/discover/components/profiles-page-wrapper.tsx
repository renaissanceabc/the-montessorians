"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { type DirectoryCounts, DirectoryShell, FilterChip } from "@/components/directory-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filterAndSortProfiles } from "@/lib/content/filter";
import {
  CONTRIBUTOR_ROLE_LABELS,
  type Profile,
  type ProfileKind,
  type Tag,
} from "@/lib/content/types";
import { DEFAULT_PROFILES_FILTERS, type getProfilesOptions } from "@/lib/types";
import {
  type AffiliationOption,
  type ContributorFilters,
  ContributorFiltersPopover,
} from "./contributor-filters-popover";
import ProfilesList from "./profiles-list";
import { TagsPopover } from "./tags-popover";

type OrderBy = NonNullable<getProfilesOptions["orderBy"]>;
type SortBy = NonNullable<getProfilesOptions["sortBy"]>;

// Single combined sort control: field + direction in one menu.
const SORT_OPTIONS = [
  { value: "latest-desc", label: "Recently added", orderBy: "latest", sortBy: "desc" },
  { value: "latest-asc", label: "Oldest first", orderBy: "latest", sortBy: "asc" },
  { value: "alphabetical-asc", label: "A–Z", orderBy: "alphabetical", sortBy: "asc" },
  { value: "alphabetical-desc", label: "Z–A", orderBy: "alphabetical", sortBy: "desc" },
  {
    value: "contributions-desc",
    label: "Most contributions",
    orderBy: "contributions",
    sortBy: "desc",
  },
] as const satisfies readonly {
  value: string;
  label: string;
  orderBy: OrderBy;
  sortBy: SortBy;
}[];

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const PATHS: Record<"all" | ProfileKind, string> = {
  all: "/discover",
  alum: "/alumni",
  contributor: "/contributors",
};

const splitList = (value: string | null) => (value ?? "").split(",").filter(Boolean);

export function ProfilesPageWrapper({
  profiles,
  tags: availableTags,
  kind,
  counts,
  affiliationOptions = [],
}: {
  profiles: Profile[];
  tags: Tag[];
  /** Omit for the "All" view */
  kind?: ProfileKind;
  counts: DirectoryCounts;
  affiliationOptions?: AffiliationOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isContributors = kind === "contributor";
  const basePath = PATHS[kind ?? "all"];

  // Initial filter state comes from the URL so deep links work on a static page.
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [orderBy, setOrderBy] = useState<OrderBy>(
    (searchParams.get("orderBy") as OrderBy) || (DEFAULT_PROFILES_FILTERS.orderBy as OrderBy)
  );
  const [sortBy, setSortBy] = useState<SortBy>(
    (searchParams.get("sortBy") as SortBy) || (DEFAULT_PROFILES_FILTERS.sortBy as SortBy)
  );
  const [tags, setTags] = useState(searchParams.get("tags") ?? "");
  const [contributorFilters, setContributorFilters] = useState<ContributorFilters>({
    roles: splitList(searchParams.get("roles")),
    organizations: splitList(searchParams.get("orgs")),
    minContributions: Number(searchParams.get("min") ?? 0) || 0,
  });
  const [debouncedSearch] = useDebounce(search, 300);

  const sortOptions = SORT_OPTIONS.filter((o) => isContributors || o.orderBy !== "contributions");
  const sortValue: SortValue =
    sortOptions.find((o) => o.orderBy === orderBy && o.sortBy === sortBy)?.value ??
    SORT_OPTIONS[0].value;

  const handleSortChange = (value: string | null) => {
    const option = SORT_OPTIONS.find((o) => o.value === value);
    if (option) {
      setOrderBy(option.orderBy);
      setSortBy(option.sortBy);
    }
  };

  const filtered = useMemo(
    () =>
      filterAndSortProfiles(profiles, {
        orderBy,
        sortBy,
        kind,
        search: debouncedSearch || undefined,
        tags: isContributors ? undefined : tags || undefined,
        roles: isContributors ? contributorFilters.roles.join(",") : undefined,
        organizations: isContributors ? contributorFilters.organizations.join(",") : undefined,
        minContributions: isContributors ? contributorFilters.minContributions : undefined,
      }),
    [profiles, orderBy, sortBy, kind, debouncedSearch, tags, isContributors, contributorFilters]
  );

  // Sync filter state to URL without triggering a server re-render
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (orderBy !== DEFAULT_PROFILES_FILTERS.orderBy) params.set("orderBy", orderBy ?? "");
    if (sortBy !== DEFAULT_PROFILES_FILTERS.sortBy) params.set("sortBy", sortBy ?? "");
    if (!isContributors && tags) params.set("tags", tags);
    if (isContributors) {
      if (contributorFilters.roles.length) params.set("roles", contributorFilters.roles.join(","));
      if (contributorFilters.organizations.length) {
        params.set("orgs", contributorFilters.organizations.join(","));
      }
      if (contributorFilters.minContributions) {
        params.set("min", String(contributorFilters.minContributions));
      }
    }
    const qs = params.toString();
    router.replace(`${basePath}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [
    debouncedSearch,
    orderBy,
    sortBy,
    tags,
    contributorFilters,
    isContributors,
    basePath,
    router,
  ]);

  const tagSlugs = splitList(tags);
  const tagLabel = (slug: string) => availableTags.find((t) => t.slug === slug)?.label ?? slug;
  const orgName = (slug: string) => affiliationOptions.find((o) => o.slug === slug)?.name ?? slug;
  const chips = isContributors
    ? [
        ...contributorFilters.roles.map((role) => ({
          key: `role-${role}`,
          label: CONTRIBUTOR_ROLE_LABELS[role as keyof typeof CONTRIBUTOR_ROLE_LABELS] ?? role,
          remove: () =>
            setContributorFilters((f) => ({ ...f, roles: f.roles.filter((r) => r !== role) })),
        })),
        ...contributorFilters.organizations.map((slug) => ({
          key: `org-${slug}`,
          label: orgName(slug),
          remove: () =>
            setContributorFilters((f) => ({
              ...f,
              organizations: f.organizations.filter((o) => o !== slug),
            })),
        })),
        ...(contributorFilters.minContributions
          ? [
              {
                key: "min",
                label: `${contributorFilters.minContributions}+ contributions`,
                remove: () => setContributorFilters((f) => ({ ...f, minContributions: 0 })),
              },
            ]
          : []),
      ]
    : tagSlugs.map((slug) => ({
        key: `tag-${slug}`,
        label: tagLabel(slug),
        remove: () => setTags(tagSlugs.filter((t) => t !== slug).join(",")),
      }));

  const clearAll = () => {
    setTags("");
    setContributorFilters({ roles: [], organizations: [], minContributions: 0 });
  };

  const total =
    kind === "alum" ? counts.alumni : kind === "contributor" ? counts.contributors : counts.all;
  const noun = kind === "contributor" ? "contributors" : "Montessorians";

  return (
    <DirectoryShell
      active={kind === "alum" ? "alumni" : kind === "contributor" ? "contributors" : "all"}
      chips={
        chips.length > 0 ? (
          <>
            {chips.map((chip) => (
              <FilterChip key={chip.key} label={chip.label} onRemove={chip.remove} />
            ))}
            <button
              className="px-1.5 py-0.5 text-muted-foreground text-xs underline hover:text-foreground"
              onClick={clearAll}
              type="button"
            >
              Clear all
            </button>
          </>
        ) : undefined
      }
      controls={
        <>
          {isContributors ? (
            <ContributorFiltersPopover
              affiliationOptions={affiliationOptions}
              applied={contributorFilters}
              onApply={setContributorFilters}
            />
          ) : (
            <TagsPopover
              availableTags={availableTags}
              initialTags={tags}
              onApplyTags={(tagSlugs) => setTags(tagSlugs)}
            />
          )}
          <Select items={sortOptions} onValueChange={handleSortChange} value={sortValue}>
            <SelectTrigger
              aria-label="Sort"
              className="h-9 border-transparent bg-transparent shadow-none hover:bg-black/5 data-popup-open:bg-black/5"
            >
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      }
      counts={counts}
      onSearch={setSearch}
      search={search}
      searchPlaceholder={`Search ${total} ${noun} by name`}
    >
      <ProfilesList hasSearch={Boolean(debouncedSearch)} profiles={filtered} />
    </DirectoryShell>
  );
}
