"use client";

import { SlidersHorizontalIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CONTRIBUTOR_ROLE_LABELS, CONTRIBUTOR_ROLES } from "@/lib/content/types";
import { cn } from "@/lib/utils";

export type ContributorFilters = {
  roles: string[];
  organizations: string[];
  minContributions: number;
};

export type AffiliationOption = { slug: string; name: string; count: number };

const MIN_CONTRIBUTION_OPTIONS = [0, 5, 10, 25];

const chipClass = (on: boolean) =>
  cn(
    "h-auto cursor-pointer rounded-full border px-3 py-1 text-xs shadow-none",
    on
      ? "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80"
      : "border-black/10 bg-white hover:border-black/50 hover:bg-white/50"
  );

export function ContributorFiltersPopover({
  applied,
  affiliationOptions,
  onApply,
}: {
  applied: ContributorFilters;
  affiliationOptions: AffiliationOption[];
  onApply: (filters: ContributorFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ContributorFilters>(applied);
  const [orgSearch, setOrgSearch] = useState("");

  const appliedCount =
    applied.roles.length + applied.organizations.length + (applied.minContributions > 0 ? 1 : 0);

  const visibleOrgs = useMemo(
    () => affiliationOptions.filter((o) => o.name.toLowerCase().includes(orgSearch.toLowerCase())),
    [affiliationOptions, orgSearch]
  );
  const orgName = (slug: string) => affiliationOptions.find((o) => o.slug === slug)?.name ?? slug;

  const toggle = (key: "roles" | "organizations", value: string) =>
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value],
    }));

  return (
    <Popover
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraft(applied);
        }
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "cursor-pointer border-black/10 bg-white font-normal shadow-none hover:border-black/50 active:bg-white",
            appliedCount > 0 &&
              "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground"
          )}
          variant="outline"
        >
          <SlidersHorizontalIcon className="size-4" />
          {appliedCount > 0 ? `Filters applied (${appliedCount})` : "Filter"}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="max-w-[calc(100vw-2rem)] p-0 sm:w-[480px]">
        <div className="flex flex-col gap-5 p-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold text-sm">Role</legend>
            <div className="flex flex-wrap gap-1">
              {CONTRIBUTOR_ROLES.map((role) => (
                <Button
                  className={chipClass(draft.roles.includes(role))}
                  key={role}
                  onClick={() => toggle("roles", role)}
                  variant="outline"
                >
                  {CONTRIBUTOR_ROLE_LABELS[role as keyof typeof CONTRIBUTOR_ROLE_LABELS]}
                </Button>
              ))}
            </div>
          </fieldset>

          {affiliationOptions.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 font-semibold text-sm">Affiliation</legend>
              <Input
                aria-label="Search affiliations"
                className="w-full rounded-full border border-black/10 bg-white text-sm shadow-none"
                onChange={(e) => setOrgSearch(e.target.value)}
                placeholder="Search schools, universities, organizations"
                value={orgSearch}
              />
              <div className="flex max-h-[180px] flex-col overflow-y-auto rounded-sm border border-black/10 bg-stone-50 p-1">
                {visibleOrgs.length > 0 ? (
                  visibleOrgs.map((org) => (
                    <label
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-white"
                      key={org.slug}
                    >
                      <input
                        checked={draft.organizations.includes(org.slug)}
                        onChange={() => toggle("organizations", org.slug)}
                        type="checkbox"
                      />
                      {org.name}
                      <span className="ml-auto text-muted-foreground text-xs">{org.count}</span>
                    </label>
                  ))
                ) : (
                  <p className="px-2 py-1 text-muted-foreground text-xs">No organizations found</p>
                )}
              </div>
            </fieldset>
          )}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold text-sm">Documented contributions</legend>
            <div className="flex gap-0.5 self-start rounded-md bg-black/5 p-0.5">
              {MIN_CONTRIBUTION_OPTIONS.map((min) => (
                <button
                  className={cn(
                    "rounded px-3 py-1 text-xs",
                    draft.minContributions === min
                      ? "bg-white font-semibold"
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

          {(draft.roles.length > 0 || draft.organizations.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {draft.roles.map((role) => (
                <Badge
                  className="h-auto border-black/10 px-3 py-1 text-xs"
                  key={role}
                  variant="secondary"
                >
                  {CONTRIBUTOR_ROLE_LABELS[role as keyof typeof CONTRIBUTOR_ROLE_LABELS]}
                  <button
                    aria-label={`Remove ${CONTRIBUTOR_ROLE_LABELS[role as keyof typeof CONTRIBUTOR_ROLE_LABELS]}`}
                    className="cursor-pointer"
                    onClick={() => toggle("roles", role)}
                    type="button"
                  >
                    <XIcon className="ml-1 h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {draft.organizations.map((slug) => (
                <Badge
                  className="h-auto border-black/10 px-3 py-1 text-xs"
                  key={slug}
                  variant="secondary"
                >
                  {orgName(slug)}
                  <button
                    aria-label={`Remove ${orgName(slug)}`}
                    className="cursor-pointer"
                    onClick={() => toggle("organizations", slug)}
                    type="button"
                  >
                    <XIcon className="ml-1 h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-row items-center justify-between gap-2 border-black/10 border-t p-4">
          <Button
            className="cursor-pointer border-black/10 bg-transparent shadow-none"
            onClick={() => {
              const cleared = { roles: [], organizations: [], minContributions: 0 };
              setDraft(cleared);
              onApply(cleared);
              setOpen(false);
            }}
            variant="outline"
          >
            Clear
          </Button>
          <Button
            className="cursor-pointer shadow-none"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            Show results
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
