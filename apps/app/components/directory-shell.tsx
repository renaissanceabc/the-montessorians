"use client";

import { SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DirectoryTab = "all" | "alumni" | "contributors" | "organizations";

export type DirectoryCounts = Record<DirectoryTab, number>;

const TABS: { id: DirectoryTab; label: string; short?: string; href: string }[] = [
  { id: "all", label: "All", href: "/discover" },
  { id: "alumni", label: "Alumni", href: "/alumni" },
  { id: "contributors", label: "Contributors", href: "/contributors" },
  { id: "organizations", label: "Organizations", short: "Orgs", href: "/organizations" },
];

/**
 * The shared top of every directory view: a search-first header, the
 * All / Alumni / Contributors / Organizations tabs, quiet filter and sort
 * controls, and removable chips for whatever filters are applied.
 */
export function DirectoryShell({
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
}) {
  return (
    <div className="container mx-auto max-w-3xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
      <div className="flex w-full flex-col gap-5">
        <div className="flex flex-col items-center gap-4">
          <h1 className="font-bold font-serif text-4xl lg:text-5xl">Explore the directory</h1>
          <label className="relative flex w-full items-center">
            <span className="sr-only">{searchPlaceholder}</span>
            <SearchIcon className="pointer-events-none absolute left-4 size-4 text-muted-foreground" />
            <input
              className="h-12 w-full rounded-full border border-black/12 bg-white pr-11 pl-11 text-base shadow-[0_2px_10px_rgba(0,0,0,0.05)] outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-black/30"
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              type="search"
              value={search}
            />
            {search && (
              <button
                aria-label="Clear search"
                className="absolute right-3 flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground"
                onClick={() => onSearch("")}
                type="button"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </label>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-black/10 border-b">
          <nav
            aria-label="Directory"
            className="-mb-px flex gap-4 overflow-x-auto [scrollbar-width:none] sm:gap-5"
          >
            {TABS.map((tab) => (
              <Link
                aria-current={tab.id === active ? "page" : undefined}
                className={cn(
                  "shrink-0 border-b-2 pb-2.5 text-[15px] transition-colors",
                  tab.id === active
                    ? "border-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
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
                    "text-xs",
                    tab.id === active ? "font-normal text-muted-foreground" : ""
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
    </div>
  );
}

/** A removable chip for an applied filter. */
export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary py-0.5 pr-1 pl-2.5 text-secondary-foreground text-xs">
      {label}
      <button
        aria-label={`Remove ${label}`}
        className="flex size-5 items-center justify-center rounded-full hover:bg-white/15"
        onClick={onRemove}
        type="button"
      >
        <XIcon className="size-3" />
      </button>
    </span>
  );
}
