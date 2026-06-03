"use client";

import { ArrowDownWideNarrowIcon, ArrowUpWideNarrowIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filterAndSortProfiles } from "@/lib/content/filter";
import type { Profile, Tag } from "@/lib/content/types";
import { DEFAULT_PROFILES_FILTERS } from "@/lib/types";
import ProfilesList from "../../../discover/components/profiles-list";

const ORDER_BY_LABELS = {
  alphabetical: "Name",
  latest: "Recently added",
} as const;

type OrderBy = NonNullable<(typeof DEFAULT_PROFILES_FILTERS)["orderBy"]>;
type SortBy = NonNullable<(typeof DEFAULT_PROFILES_FILTERS)["sortBy"]>;

export function TagProfilesPageWrapper({ tag, profiles }: { tag: Tag; profiles: Profile[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orderBy, setOrderBy] = useState<OrderBy>(
    (searchParams.get("orderBy") as OrderBy) || (DEFAULT_PROFILES_FILTERS.orderBy as OrderBy)
  );
  const [sortBy, setSortBy] = useState<SortBy>(
    (searchParams.get("sortBy") as SortBy) || (DEFAULT_PROFILES_FILTERS.sortBy as SortBy)
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (orderBy !== DEFAULT_PROFILES_FILTERS.orderBy) params.set("orderBy", orderBy);
    if (sortBy !== DEFAULT_PROFILES_FILTERS.sortBy) params.set("sortBy", sortBy);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [orderBy, sortBy, router]);

  const filtered = useMemo(
    () => filterAndSortProfiles(profiles, { orderBy, sortBy }),
    [profiles, orderBy, sortBy]
  );

  return (
    <div className="container mx-auto max-w-screen-md items-center justify-between gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full space-y-8">
        <div className="flex w-full flex-col items-center gap-2">
          <Link
            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
            href="/tags"
          >
            All Tags
          </Link>
          <h1 className="font-bold font-serif text-4xl lg:text-5xl">{tag.label}</h1>
        </div>

        <div className="flex w-full items-center justify-end gap-1">
          <Select onValueChange={(value) => setOrderBy(value as OrderBy)} value={orderBy}>
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
            aria-label={sortBy === "asc" ? "Sort descending" : "Sort ascending"}
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

        <ProfilesList hasSearch={false} profiles={filtered} />
      </div>
    </div>
  );
}
