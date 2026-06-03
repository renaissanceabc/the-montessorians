"use client";

import { SearchIcon, XIcon } from "lucide-react";
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
import type { Profile, Tag } from "@/lib/content/types";
import { DEFAULT_PROFILES_FILTERS, type getProfilesOptions } from "@/lib/types";
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
] as const satisfies readonly {
  value: string;
  label: string;
  orderBy: OrderBy;
  sortBy: SortBy;
}[];

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function ProfilesPageWrapper({
  profiles,
  tags: availableTags,
}: {
  profiles: Profile[];
  tags: Tag[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial filter state comes from the URL so deep links work on a static page.
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [orderBy, setOrderBy] = useState<OrderBy>(
    (searchParams.get("orderBy") as OrderBy) || (DEFAULT_PROFILES_FILTERS.orderBy as OrderBy)
  );
  const [sortBy, setSortBy] = useState<SortBy>(
    (searchParams.get("sortBy") as SortBy) || (DEFAULT_PROFILES_FILTERS.sortBy as SortBy)
  );
  const [tags, setTags] = useState(searchParams.get("tags") ?? "");
  const [debouncedSearch] = useDebounce(search, 400);

  const sortValue: SortValue =
    SORT_OPTIONS.find((o) => o.orderBy === orderBy && o.sortBy === sortBy)?.value ??
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
        search: debouncedSearch || undefined,
        tags: tags || undefined,
      }),
    [profiles, orderBy, sortBy, debouncedSearch, tags]
  );

  // Sync filter state to URL without triggering a server re-render
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (orderBy !== DEFAULT_PROFILES_FILTERS.orderBy) params.set("orderBy", orderBy ?? "");
    if (sortBy !== DEFAULT_PROFILES_FILTERS.sortBy) params.set("sortBy", sortBy ?? "");
    if (tags) params.set("tags", tags);
    const qs = params.toString();
    router.replace(`/discover${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [debouncedSearch, orderBy, sortBy, tags, router]);

  return (
    <div className="container mx-auto max-w-screen-md items-center justify-between gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full space-y-8">
        <h1 className="flex w-full justify-center font-bold font-serif text-4xl lg:text-5xl">
          Explore the directory
        </h1>

        <div className="flex w-full flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="relative flex w-full flex-row items-center gap-2 sm:w-auto">
            <Input
              className="w-full rounded-full border border-black/10 bg-white pl-10 text-sm shadow-none transition-colors sm:w-[260px]"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for a Montessorian"
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
            <TagsPopover
              availableTags={availableTags}
              initialTags={tags}
              onApplyTags={(tagSlugs) => setTags(tagSlugs)}
            />

            <Select onValueChange={handleSortChange} value={sortValue}>
              <SelectTrigger className="border-black/10 bg-white shadow-none transition-colors hover:border-black/50 data-[state=open]:bg-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>

              <SelectContent>
                {SORT_OPTIONS.map((option) => (
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
