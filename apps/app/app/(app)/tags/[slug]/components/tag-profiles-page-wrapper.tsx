"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Container } from "@/components/container";
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
    <Container className="flex flex-col gap-6 pt-6 pb-16 lg:pt-8">
      <div className="flex flex-col gap-3">
        <Breadcrumbs
          align="start"
          items={[{ href: "/tags", label: "Tags" }, { label: tag.label }]}
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="type-title">{tag.label}</h1>
            <p className="type-lead">
              {profiles.length} {profiles.length === 1 ? "Montessorian" : "Montessorians"}
            </p>
          </div>

          <Select items={SORT_OPTIONS} onValueChange={handleSortChange} value={sortValue}>
            <SelectTrigger
              aria-label="Sort"
              className="w-fit shrink-0 border-black/10 bg-white shadow-none transition-colors hover:border-black/50 data-popup-open:bg-white"
            >
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

      <ProfilesList hasSearch={false} profiles={filtered} />
    </Container>
  );
};
