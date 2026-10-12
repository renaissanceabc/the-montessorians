"use client";

import { SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filterAndSortProfiles } from "@/lib/content/filter";
import type { Profile, ProfileKind, Tag } from "@/lib/content/types";
import { DEFAULT_PROFILES_FILTERS, type getProfilesOptions } from "@/lib/types";
import { cn } from "@/lib/utils";
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

const COLLECTIONS = [
  { kind: "alum", label: "Alumni", href: "/discover" },
  { kind: "contributor", label: "Contributors", href: "/contributors" },
] as const;

const splitList = (value: string | null) => (value ?? "").split(",").filter(Boolean);

export function ProfilesPageWrapper({
  profiles,
  tags: availableTags,
  kind = "alum",
  affiliationOptions = [],
}: {
  profiles: Profile[];
  tags: Tag[];
  kind?: ProfileKind;
  affiliationOptions?: AffiliationOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isContributors = kind === "contributor";
  const basePath = isContributors ? "/contributors" : "/discover";

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
  const [debouncedSearch] = useDebounce(search, 400);

  const sortOptions = SORT_OPTIONS.filter((o) => isContributors || o.orderBy !== "contributions");
  const sortValue: SortValue =
    sortOptions.find((o) => o.orderBy === orderBy && o.sortBy === sortBy)?.value ??
    SORT_OPTIONS[0].value;

  const handleSortChange = (value: string) => {
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

  return (
    <div className="container mx-auto max-w-screen-md items-center justify-between gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full space-y-8">
        <h1 className="flex w-full justify-center font-bold font-serif text-4xl lg:text-5xl">
          Explore the directory
        </h1>

        <nav
          aria-label="Collections"
          className="flex justify-center gap-7 border-black/10 border-b"
        >
          {COLLECTIONS.map((collection) => (
            <Link
              aria-current={collection.kind === kind ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-0.5 pb-2.5 text-base transition-colors",
                collection.kind === kind
                  ? "border-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              href={collection.href}
              key={collection.kind}
            >
              {collection.label}
            </Link>
          ))}
        </nav>

        <div className="flex w-full flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="relative flex w-full flex-row items-center gap-2 sm:w-auto">
            <Input
              className="w-full rounded-full border border-black/10 bg-white pl-10 text-sm shadow-none transition-colors sm:w-[260px]"
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isContributors ? "Search for a contributor" : "Search for a Montessorian"
              }
              value={search}
            />
            <SearchIcon className="absolute left-3 size-4" />
            {search && (
              <XIcon
                className="absolute right-3 size-4 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setSearch("")}
              />
            )}
          </div>

          <div className="flex flex-row items-center gap-1">
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

            <Select onValueChange={handleSortChange} value={sortValue}>
              <SelectTrigger className="border-black/10 bg-white shadow-none transition-colors hover:border-black/50 data-[state=open]:bg-white">
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
          </div>
        </div>

        <ProfilesList hasSearch={Boolean(debouncedSearch)} profiles={filtered} />
      </div>
    </div>
  );
}
