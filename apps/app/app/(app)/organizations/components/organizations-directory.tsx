"use client";

import {
  Building2Icon,
  GraduationCapIcon,
  LandmarkIcon,
  SearchXIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { type DirectoryCounts, DirectoryShell } from "@/components/directory-shell";
import { OrgLogo } from "@/components/org-logo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrganizationType } from "@/lib/content/types";
import { cn } from "@/lib/utils";

export type OrganizationRow = {
  slug: string;
  name: string;
  shortName?: string;
  nameVariants: string[];
  type: OrganizationType;
  typeLabel: string;
  location?: string;
  logoUrl: string | null;
  people: number;
};

const TYPE_FILTERS: { label: string; types: OrganizationType[] }[] = [
  { label: "Schools", types: ["school"] },
  { label: "Training Centers", types: ["training-center"] },
  { label: "Universities and Colleges", types: ["university", "research-center"] },
  { label: "Associations", types: ["association"] },
];

const TYPE_ICONS: Partial<Record<OrganizationType, typeof Building2Icon>> = {
  school: GraduationCapIcon,
  association: LandmarkIcon,
};

const SORT_ITEMS = [
  { value: "people", label: "Most people" },
  { value: "name", label: "A–Z" },
];

export function OrganizationsDirectory({
  organizations,
  counts,
}: {
  organizations: OrganizationRow[];
  counts: DirectoryCounts;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<"people" | "name">("people");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const types = TYPE_FILTERS.find((t) => t.label === typeFilter)?.types;
    return organizations
      .filter((o) => !types || types.includes(o.type))
      .filter(
        (o) =>
          !q ||
          [o.name, o.shortName, o.location, ...o.nameVariants].some((v) =>
            v?.toLowerCase().includes(q)
          )
      )
      .sort(
        (a, b) => (sort === "people" ? b.people - a.people : 0) || a.name.localeCompare(b.name)
      );
  }, [organizations, search, typeFilter, sort]);

  return (
    <DirectoryShell
      active="organizations"
      chips={
        <>
          {[{ label: "All types" }, ...TYPE_FILTERS].map((t) => {
            const on = t.label === "All types" ? typeFilter === null : typeFilter === t.label;
            return (
              <button
                aria-pressed={on}
                className={cn(
                  "h-8 rounded-full border px-3 text-[13px] transition-colors",
                  on
                    ? "border-secondary bg-secondary text-secondary-foreground"
                    : "border-black/12 bg-white/50 hover:border-black/30"
                )}
                key={t.label}
                onClick={() => setTypeFilter(t.label === "All types" ? null : t.label)}
                type="button"
              >
                {t.label}
              </button>
            );
          })}
        </>
      }
      controls={
        <Select
          items={SORT_ITEMS}
          onValueChange={(v) => v && setSort(v as "people" | "name")}
          value={sort}
        >
          <SelectTrigger
            aria-label="Sort"
            className="h-9 border-transparent bg-transparent shadow-none hover:bg-black/5 data-popup-open:bg-black/5"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="people">Most people</SelectItem>
            <SelectItem value="name">A–Z</SelectItem>
          </SelectContent>
        </Select>
      }
      counts={counts}
      onSearch={setSearch}
      search={search}
      searchPlaceholder={`Search ${counts.organizations} organizations`}
    >
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-muted-foreground text-sm italic">
          <SearchXIcon className="size-16" />
          No organizations found.
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {filtered.map((org) => {
            const Icon = TYPE_ICONS[org.type] ?? Building2Icon;
            return (
              <li key={org.slug}>
                <Link
                  className="group flex items-center gap-4 rounded-lg border border-transparent p-3 transition-all hover:border-black/10 hover:bg-white"
                  href={`/organizations/${org.slug}`}
                >
                  <OrgLogo
                    className="size-12 rounded-xl"
                    icon={Icon}
                    iconClassName="size-[22px] text-muted-foreground"
                    logoUrl={org.logoUrl}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold font-serif text-xl group-hover:text-primary">
                      {org.name}
                      {org.shortName && (
                        <span className="font-normal text-base text-muted-foreground">
                          {" "}
                          ({org.shortName})
                        </span>
                      )}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {[org.typeLabel, org.location].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span
                    className="inline-flex shrink-0 items-center gap-1 text-[#4A433D] text-sm tabular-nums"
                    title={`${org.people} ${org.people === 1 ? "person" : "people"} in the directory`}
                  >
                    <UsersIcon className="size-3.5" />
                    {org.people}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DirectoryShell>
  );
}
