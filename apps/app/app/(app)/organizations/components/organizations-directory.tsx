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

import { DirectoryShell } from "@/components/directory-shell";
import type { DirectoryCounts } from "@/components/directory-shell";
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

export interface OrganizationRow {
  slug: string;
  name: string;
  shortName?: string;
  nameVariants: string[];
  type: OrganizationType;
  typeLabel: string;
  location?: string;
  logoUrl: string | null;
  people: number;
}

const TYPE_FILTERS: { label: string; types: OrganizationType[] }[] = [
  { label: "Schools", types: ["school"] },
  { label: "Training Centers", types: ["training-center"] },
  { label: "Universities and Colleges", types: ["university", "research-center"] },
  { label: "Associations", types: ["association"] },
];

const TYPE_ICONS: Partial<Record<OrganizationType, typeof Building2Icon>> = {
  association: LandmarkIcon,
  school: GraduationCapIcon,
};

const SORT_ITEMS = [
  { label: "Most people", value: "people" },
  { label: "A–Z", value: "name" },
];

export const OrganizationsDirectory = ({
  organizations,
  counts,
}: {
  organizations: OrganizationRow[];
  counts: DirectoryCounts;
}) => {
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
      .toSorted(
        (a, b) => (sort === "people" ? b.people - a.people : 0) || a.name.localeCompare(b.name)
      );
  }, [organizations, search, typeFilter, sort]);

  return (
    <DirectoryShell
      active="organizations"
      chips={
        // One scrolling row on phones, bleeding to the screen edges; wraps from sm.
        <div className="flex w-full gap-1 max-sm:-mx-(--gutter) max-sm:w-[calc(100%+2*var(--gutter))] max-sm:overflow-x-auto max-sm:px-(--gutter) max-sm:[scrollbar-width:none] sm:flex-wrap max-sm:[&::-webkit-scrollbar]:hidden">
          {[{ label: "All types" }, ...TYPE_FILTERS].map((t) => {
            const on = t.label === "All types" ? typeFilter === null : typeFilter === t.label;
            return (
              <button
                aria-pressed={on}
                className={cn(
                  "h-8 shrink-0 rounded-full border px-3 text-[13px] whitespace-nowrap transition-[color,background-color,border-color,scale] duration-150 ease-out active:scale-[0.97] motion-reduce:active:scale-100",
                  on
                    ? "border-secondary bg-secondary text-secondary-foreground"
                    : "text-foreground border-black/12 bg-white/50 hover:border-black/30"
                )}
                key={t.label}
                onClick={() => setTypeFilter(t.label === "All types" ? null : t.label)}
                type="button"
              >
                {t.label}
              </button>
            );
          })}
        </div>
      }
      controls={
        <Select
          items={SORT_ITEMS}
          // SAFETY: SORT_ITEMS only holds the values "people" and "name".
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
      searchPlaceholder={`Search ${counts.organizations} organizations…`}
    >
      {filtered.length === 0 ? (
        <div className="text-muted-foreground flex min-h-64 flex-col items-center justify-center gap-4 py-12 text-sm italic">
          <SearchXIcon aria-hidden="true" className="size-16" />
          No organizations found.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((org) => {
            const Icon = TYPE_ICONS[org.type] ?? Building2Icon;
            return (
              <li className="min-w-0" key={org.slug}>
                <Link
                  className="group flex h-full min-w-0 items-start gap-4 rounded-xl border border-black/8 bg-white/45 p-4 transition-[color,background-color,border-color,scale] duration-150 ease-out hover:border-black/15 hover:bg-white active:scale-[0.985] motion-reduce:active:scale-100"
                  href={`/organizations/${org.slug}`}
                >
                  <OrgLogo
                    className="size-14 rounded-xl"
                    icon={Icon}
                    iconClassName="size-6 text-muted-foreground"
                    logoUrl={org.logoUrl}
                    size={56}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="type-name group-hover:text-primary transition-colors">
                      {org.name}
                      {org.shortName && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          ({org.shortName})
                        </span>
                      )}
                    </span>
                    <span className="type-meta">
                      {[org.typeLabel, org.location].filter(Boolean).join(" · ")}
                    </span>
                    <span
                      className="type-meta inline-flex items-center gap-1.5 text-[#4A433D] tabular-nums"
                      title={`${org.people} ${org.people === 1 ? "person" : "people"} in the directory`}
                    >
                      <UsersIcon aria-hidden="true" className="size-3.5" />
                      {org.people === 0
                        ? "No people yet"
                        : `${org.people} ${org.people === 1 ? "person" : "people"}`}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DirectoryShell>
  );
};
