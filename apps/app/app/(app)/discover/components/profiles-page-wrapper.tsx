"use client";

import { ArrowDownWideNarrowIcon, ArrowUpWideNarrowIcon, SearchIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_PROFILES_FILTERS, type getProfilesOptions } from "@/lib/types";
import ProfilesPaginatedList from "./profiles-list";
import { TagsPopover } from "./tags-popover";

const ORDER_BY_LABELS = {
  alphabetical: "Name",
  latest: "Recently added",
  trending: "Trending",
} as const;

export function ProfilesPageWrapper({
  initialFilters,
}: {
  initialFilters: Omit<getProfilesOptions, "page">;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialFilters.search ?? "");
  const [orderBy, setOrderBy] = useState(
    initialFilters.orderBy ?? DEFAULT_PROFILES_FILTERS.orderBy
  );
  const [sortBy, setSortBy] = useState(initialFilters.sortBy ?? DEFAULT_PROFILES_FILTERS.sortBy);
  const [tags, setTags] = useState(initialFilters.tags ?? "");
  const [debouncedSearch] = useDebounce(search, 400);

  const filters = {
    ...initialFilters,
    orderBy,
    sortBy,
    search: debouncedSearch || undefined,
    tags: tags || undefined,
  };

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
              initialTags={initialFilters.tags ?? ""}
              onApplyTags={(tagSlugs) => setTags(tagSlugs)}
            />

            <Select
              onValueChange={(value) =>
                setOrderBy(value as typeof DEFAULT_PROFILES_FILTERS.orderBy)
              }
              value={orderBy}
            >
              <SelectTrigger className="border-black/10 bg-white shadow-none transition-colors hover:border-black/50 data-[state=open]:bg-white">
                <SelectValue>
                  {ORDER_BY_LABELS[orderBy as keyof typeof ORDER_BY_LABELS] ?? "Sort by"}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="latest">Recently added</SelectItem>
                <SelectItem value="alphabetical">Name</SelectItem>
              </SelectContent>
            </Select>

            <Button
              className="cursor-pointer border-black/10 shadow-none hover:bg-white/50 active:bg-white"
              onClick={() => setSortBy(sortBy === "asc" ? "desc" : "asc")}
              variant="ghost"
            >
              {sortBy === "asc" ? (
                <ArrowUpWideNarrowIcon className="h-4 w-4" />
              ) : (
                <ArrowDownWideNarrowIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <ProfilesPaginatedList filters={filters} />
      </div>
    </div>
  );
}
