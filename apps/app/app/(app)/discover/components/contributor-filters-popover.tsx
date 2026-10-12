"use client";

import { CheckIcon, SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CONTRIBUTOR_ROLE_LABELS, CONTRIBUTOR_ROLES } from "@/lib/content/types";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";

export interface ContributorFilters {
  roles: string[];
  organizations: string[];
  minContributions: number;
}

export interface AffiliationOption {
  slug: string;
  name: string;
  count: number;
}

const MIN_CONTRIBUTION_OPTIONS = [0, 5, 10, 25];

const chipClass = (on: boolean) =>
  cn(
    "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] transition-colors",
    on
      ? "border-secondary bg-secondary text-secondary-foreground"
      : "border-black/12 bg-white/60 hover:border-black/40"
  );

export const ContributorFiltersPopover = ({
  applied,
  affiliationOptions,
  onApply,
}: {
  applied: ContributorFilters;
  affiliationOptions: AffiliationOption[];
  onApply: (filters: ContributorFilters) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ContributorFilters>(applied);
  const [orgSearch, setOrgSearch] = useState("");
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const appliedCount =
    applied.roles.length + applied.organizations.length + (applied.minContributions > 0 ? 1 : 0);

  const visibleOrgs = useMemo(
    () => affiliationOptions.filter((o) => o.name.toLowerCase().includes(orgSearch.toLowerCase())),
    [affiliationOptions, orgSearch]
  );

  const toggle = (key: "roles" | "organizations", value: string) =>
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value],
    }));

  const draftCount =
    draft.roles.length + draft.organizations.length + (draft.minContributions > 0 ? 1 : 0);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setDraft(applied);
      setOrgSearch("");
    }
  };

  const triggerClass = cn(
    "h-9 cursor-pointer border-transparent bg-transparent font-normal shadow-none hover:bg-black/5 data-popup-open:bg-black/5",
    appliedCount > 0 && "font-medium"
  );
  const triggerLabel = (
    <>
      <SlidersHorizontalIcon className="size-4" />
      {appliedCount > 0 ? `Filter · ${appliedCount}` : "Filter"}
    </>
  );

  const panel = (
    <div className="flex max-h-[min(80dvh,620px)] flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-1">
        <p className="text-sm font-semibold">
          Filter contributors
          {draftCount > 0 && (
            <span className="text-muted-foreground ml-1.5 font-normal">
              · {draftCount} selected
            </span>
          )}
        </p>
        {!isDesktop && (
          <Button
            aria-label="Close"
            onClick={() => setOpen(false)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <XIcon />
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain p-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
            Role
          </legend>
          <div className="flex flex-wrap gap-1">
            {CONTRIBUTOR_ROLES.map((role) => {
              const on = draft.roles.includes(role);
              return (
                <button
                  aria-pressed={on}
                  className={chipClass(on)}
                  key={role}
                  onClick={() => toggle("roles", role)}
                  type="button"
                >
                  {on && <CheckIcon className="size-3.5" />}
                  {CONTRIBUTOR_ROLE_LABELS[role]}
                </button>
              );
            })}
          </div>
        </fieldset>

        {affiliationOptions.length > 0 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
              Affiliation
            </legend>
            {affiliationOptions.length > 6 && (
              <InputGroup className="h-10">
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  aria-label="Search affiliations"
                  onChange={(e) => setOrgSearch(e.target.value)}
                  placeholder="Search organizations"
                  value={orgSearch}
                />
              </InputGroup>
            )}
            <div className="flex flex-col">
              {visibleOrgs.length > 0 ? (
                visibleOrgs.map((org) => (
                  <label
                    className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-2 text-sm hover:bg-black/4"
                    key={org.slug}
                  >
                    <Checkbox
                      checked={draft.organizations.includes(org.slug)}
                      onCheckedChange={() => toggle("organizations", org.slug)}
                    />
                    <span className="min-w-0 flex-1">{org.name}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">{org.count}</span>
                  </label>
                ))
              ) : (
                <p className="text-muted-foreground py-3 text-center text-sm">
                  No organizations match &quot;{orgSearch}&quot;
                </p>
              )}
            </div>
          </fieldset>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
            Documented contributions
          </legend>
          <div className="flex gap-0.5 self-start rounded-full bg-black/5 p-0.5">
            {MIN_CONTRIBUTION_OPTIONS.map((min) => (
              <button
                aria-pressed={draft.minContributions === min}
                className={cn(
                  "h-8 rounded-full px-3.5 text-[13px]",
                  draft.minContributions === min
                    ? "bg-white font-semibold shadow-xs"
                    : "text-muted-foreground"
                )}
                key={min}
                onClick={() => setDraft((d) => ({ ...d, minContributions: min }))}
                type="button"
              >
                {min === 0 ? "Any" : `${min}+`}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-black/10 px-4 py-3">
        <Button
          disabled={draftCount === 0}
          onClick={() => setDraft({ minContributions: 0, organizations: [], roles: [] })}
          type="button"
          variant="ghost"
        >
          Clear
        </Button>
        <Button
          className="flex-1 sm:flex-none"
          onClick={() => {
            onApply(draft);
            setOpen(false);
          }}
          type="button"
        >
          Show results
        </Button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Popover onOpenChange={onOpenChange} open={open}>
        <PopoverTrigger render={<Button className={triggerClass} variant="outline" />}>
          {triggerLabel}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[420px] gap-0 p-0">
          {panel}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerTrigger render={<Button className={triggerClass} variant="outline" />}>
        {triggerLabel}
      </DrawerTrigger>
      <DrawerContent className="bg-background">
        <DrawerTitle className="sr-only">Filter contributors</DrawerTitle>
        {panel}
      </DrawerContent>
    </Drawer>
  );
};
