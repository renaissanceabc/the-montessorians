"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

type OrderBy = NonNullable<(typeof DEFAULT_PROFILES_FILTERS)["orderBy"]>;
type SortBy = NonNullable<(typeof DEFAULT_PROFILES_FILTERS)["sortBy"]>;

// Single combined sort control: field + direction in one menu.
const SORT_OPTIONS = [
  { label: "Recently added", orderBy: "latest", sortBy: "desc", value: "latest-desc" },
  { label: "Oldest first", orderBy: "latest", sortBy: "asc", value: "latest-asc" },
  { label: "A–Z", orderBy: "alphabetical", sortBy: "asc", value: "alphabetical-asc" },
  { label: "Z–A", orderBy: "alphabetical", sortBy: "desc", value: "alphabetical-desc" },
] as const satisfies readonly {
  value: string;
  label: string;
  orderBy: OrderBy;
  sortBy: SortBy;
}[];

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const TagProfilesPageWrapper = ({ tag, profiles }: { tag: Tag; profiles: Profile[] }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // SAFETY: DEFAULT_PROFILES_FILTERS always sets orderBy and sortBy. An unrecognized URL
  // value matches no SORT_OPTIONS entry and the list falls back to its default order.
  const [orderBy, setOrderBy] = useState<OrderBy>(
    (searchParams.get("orderBy") as OrderBy) || (DEFAULT_PROFILES_FILTERS.orderBy as OrderBy)
  );
  // SAFETY: DEFAULT_PROFILES_FILTERS always sets orderBy and sortBy. An unrecognized URL
  // value matches no SORT_OPTIONS entry and the list falls back to its default order.
  const [sortBy, setSortBy] = useState<SortBy>(
    (searchParams.get("sortBy") as SortBy) || (DEFAULT_PROFILES_FILTERS.sortBy as SortBy)
  );

  const sortValue: SortValue =
    SORT_OPTIONS.find((o) => o.orderBy === orderBy && o.sortBy === sortBy)?.value ??
    SORT_OPTIONS[0].value;

  const handleSortChange = (value: string | null) => {
    const option = SORT_OPTIONS.find((o) => o.value === value);
    if (option) {
      setOrderBy(option.orderBy);
      setSortBy(option.sortBy);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (orderBy !== DEFAULT_PROFILES_FILTERS.orderBy) {
      params.set("orderBy", orderBy);
    }
    if (sortBy !== DEFAULT_PROFILES_FILTERS.sortBy) {
      params.set("sortBy", sortBy);
    }
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
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            href="/tags"
          >
            All Tags
          </Link>
          <h1 className="font-serif text-4xl font-bold lg:text-5xl">{tag.label}</h1>
        </div>

        <div className="flex w-full items-center justify-end gap-1">
          <Select items={SORT_OPTIONS} onValueChange={handleSortChange} value={sortValue}>
            <SelectTrigger className="border-black/10 bg-white shadow-none transition-colors hover:border-black/50 data-popup-open:bg-white">
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

        <ProfilesList hasSearch={false} profiles={filtered} />
      </div>
    </div>
  );
};
