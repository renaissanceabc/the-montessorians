"use client";

import { SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Container } from "./container";

export type DirectoryTab = "all" | "alumni" | "contributors" | "organizations";

export type DirectoryCounts = Record<DirectoryTab, number>;

const TABS: { id: DirectoryTab; label: string; short?: string; href: string }[] = [
  { href: "/discover", id: "all", label: "All" },
  { href: "/alumni", id: "alumni", label: "Alumni" },
  { href: "/contributors", id: "contributors", label: "Contributors" },
  { href: "/organizations", id: "organizations", label: "Organizations", short: "Orgs" },
];

const SUBTITLES: Record<DirectoryTab, string> = {
  all: "Montessori alumni who did great things, and the people who shaped the field.",
  alumni: "People who went to a Montessori school and went on to do great things.",
  contributors: "Researchers, authors, trainers, and philosophers who shaped Montessori.",
  organizations: "Schools, training centers, universities, and associations.",
};

/**
 * The shared top of every directory view: the title and a search box on one
 * row, the All / Alumni / Contributors / Organizations tabs with quiet filter
 * and sort controls, and removable chips for whatever filters are applied.
 */
export const DirectoryShell = ({
  active,
  counts,
  search,
  onSearch,
  searchPlaceholder,
  controls,
  chips,
  children,
}: {
  active: DirectoryTab;
  counts: DirectoryCounts;
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  controls?: ReactNode;
  chips?: ReactNode;
  children: ReactNode;
}) => (
  <Container className="pt-6 pb-16 lg:pt-8">
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="type-title">Explore the directory</h1>
          {/* Every subtitle fits one line at xl; below that, reserve two so switching tabs doesn't shift the layout. */}
          <p className="type-lead min-h-[3.2em] text-balance xl:min-h-0">{SUBTITLES[active]}</p>
        </div>
        <label className="relative flex w-full shrink-0 items-center lg:w-sm">
          <span className="sr-only">{searchPlaceholder}</span>
          <SearchIcon
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute left-4 size-4"
          />
          <input
            className="placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-ring/25 h-12 w-full rounded-full border border-black/12 bg-white pr-11 pl-11 text-base shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-[border-color,box-shadow] outline-none focus-visible:ring-4"
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            type="search"
            value={search}
          />
          {search && (
            <button
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground absolute right-3 flex size-7 items-center justify-center rounded-full hover:bg-black/5"
              onClick={() => onSearch("")}
              type="button"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </label>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-black/10">
        <nav
          aria-label="Directory"
          className="-mb-px flex gap-4 overflow-x-auto [scrollbar-width:none] sm:gap-5"
        >
          {TABS.map((tab) => (
            <Link
              aria-current={tab.id === active ? "page" : undefined}
              className={cn(
                "shrink-0 border-b-2 pb-2.5 text-[15px] transition-colors focus-visible:-outline-offset-2",
                tab.id === active
                  ? "border-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              )}
              href={tab.href}
              key={tab.id}
            >
              {tab.short ? (
                <>
                  <span className="sm:hidden">{tab.short}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </>
              ) : (
                tab.label
              )}{" "}
              <span
                className={cn(
                  "text-xs tabular-nums",
                  tab.id === active ? "text-muted-foreground font-normal" : ""
                )}
              >
                {counts[tab.id]}
              </span>
            </Link>
          ))}
        </nav>
        {controls && (
          // Inline beside the tabs on larger screens; a floating toolbar at the
          // bottom of the screen on phones, within thumb reach.
          <div
            aria-label="Filter and sort"
            className={cn(
              "flex items-center gap-1 sm:pb-1.5",
              "max-sm:fixed max-sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] max-sm:left-1/2 max-sm:z-40 max-sm:-translate-x-1/2 max-sm:rounded-full max-sm:bg-white/95 max-sm:p-1 max-sm:shadow-[0_8px_30px_rgba(0,0,0,0.12)] max-sm:ring-1 max-sm:ring-black/10 max-sm:backdrop-blur",
              "max-sm:*:rounded-full"
            )}
            data-print-hidden
            role="toolbar"
          >
            {controls}
          </div>
        )}
      </div>

      {chips && <div className="flex flex-wrap items-center gap-1">{chips}</div>}

      {/* Room for the floating toolbar on phones */}
      <div className={cn(controls && "max-sm:pb-20")}>{children}</div>
    </div>
  </Container>
);

/** A removable chip for an applied filter. */
export const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="bg-secondary text-secondary-foreground inline-flex max-w-full items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-xs">
    <span className="truncate">{label}</span>
    <button
      aria-label={`Remove ${label}`}
      className="flex size-5 shrink-0 items-center justify-center rounded-full hover:bg-white/15"
      onClick={onRemove}
      type="button"
    >
      <XIcon className="size-3" />
    </button>
  </span>
);
