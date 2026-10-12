"use client";

import { Building2Icon, PencilIcon, PlusIcon, SearchIcon, UsersIcon, XIcon } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

export type OrganizationOption = {
  slug: string;
  name: string;
  shortName?: string;
  meta: string;
  people: number;
};

export type PickedOrganization = {
  /** Existing organization slug, or undefined for a new one */
  organization?: string;
  name: string;
  role?: string;
};

const MAX_SUGGESTIONS = 6;

const label = (o: { name: string; shortName?: string }) =>
  o.shortName ? `${o.name} (${o.shortName})` : o.name;

/**
 * Pick existing organizations as you type (matched on name or short name), or
 * add a new one by name; new ones are reviewed with the submission.
 */
export function OrganizationPicker({
  options,
  value,
  onChange,
  placeholder,
  withRole,
  id,
  invalid,
}: {
  id?: string;
  invalid?: boolean;
  options: OrganizationOption[];
  value: PickedOrganization[];
  onChange: (value: PickedOrganization[]) => void;
  placeholder: string;
  withRole?: boolean;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(0);
  const q = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!q) {
      return [];
    }
    const chosen = new Set(value.map((v) => v.organization));
    return options
      .filter((o) => !chosen.has(o.slug))
      .filter((o) => o.name.toLowerCase().includes(q) || o.shortName?.toLowerCase() === q)
      .slice(0, MAX_SUGGESTIONS);
  }, [q, options, value]);
  const exact = options.some((o) => o.name.toLowerCase() === q || o.shortName?.toLowerCase() === q);
  const canAdd = q.length > 1 && !exact;
  const items = [
    ...matches.map((m) => ({ kind: "existing" as const, option: m })),
    ...(canAdd ? [{ kind: "new" as const }] : []),
  ];

  const pick = (item: (typeof items)[number]) => {
    onChange([
      ...value,
      item.kind === "existing"
        ? { organization: item.option.slug, name: label(item.option) }
        : { name: query.trim() },
    ]);
    setQuery("");
    setActive(0);
  };

  return (
    <div className="flex flex-col gap-2">
      {value.map((picked, i) => (
        <div
          className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-lg border border-input bg-background py-1.5 pr-1.5 pl-3"
          // Keyed by position for new organizations so renaming keeps focus.
          key={picked.organization ?? `new-${i}`}
        >
          <Building2Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
            {picked.organization ? (
              <span className="truncate font-medium text-sm">{picked.name}</span>
            ) : (
              // A new organization's name stays editable, to fix a typo after "Add".
              <input
                aria-label="New organization name"
                className="-mx-1.5 rounded px-1.5 py-0.5 font-medium text-sm outline-none hover:bg-black/4 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-ring/50"
                onChange={(e) =>
                  onChange(value.map((v, j) => (j === i ? { ...v, name: e.target.value } : v)))
                }
                value={picked.name}
              />
            )}
            {!picked.organization && (
              <span className="text-[11px] text-[#9A4A14]">
                New organization, reviewed with your submission
              </span>
            )}
          </span>
          {withRole && (
            <Input
              aria-label={`Role at ${picked.name}`}
              className="h-8 w-full flex-1 basis-32 sm:max-w-44"
              onChange={(e) =>
                onChange(
                  value.map((v, j) => (j === i ? { ...v, role: e.target.value || undefined } : v))
                )
              }
              placeholder="Role (optional)"
              value={picked.role ?? ""}
            />
          )}
          {picked.organization && (
            <button
              aria-label={`Change ${picked.name}`}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-black/5 hover:text-foreground"
              onClick={() => {
                // Put it back in the search box to pick another or edit the text.
                onChange(value.filter((_, j) => j !== i));
                setQuery(picked.name);
                setActive(0);
                searchRef.current?.focus();
              }}
              title="Change"
              type="button"
            >
              <PencilIcon className="size-3.5" />
            </button>
          )}
          <button
            aria-label={`Remove ${picked.name}`}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-black/5 hover:text-foreground"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            type="button"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ))}

      <InputGroup className="relative h-10">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          aria-activedescendant={items.length ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={items.length > 0}
          aria-invalid={invalid || undefined}
          id={id}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (!items.length) {
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => (a + 1) % items.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a - 1 + items.length) % items.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              pick(items[active]);
            } else if (e.key === "Escape") {
              setQuery("");
            }
          }}
          placeholder={placeholder}
          ref={searchRef}
          role="combobox"
          value={query}
        />
        {items.length > 0 && (
          <ul
            className="absolute inset-x-0 top-full z-20 mt-1 flex flex-col rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
            id={listId}
            role="listbox"
          >
            {items.map((item, i) => (
              <li
                aria-selected={i === active}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm",
                  i === active && "bg-black/5",
                  item.kind === "new" && "mt-1 border-black/8 border-t"
                )}
                id={`${listId}-${i}`}
                key={item.kind === "existing" ? item.option.slug : "new"}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(item);
                }}
                onMouseEnter={() => setActive(i)}
                role="option"
              >
                {item.kind === "existing" ? (
                  <>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{label(item.option)}</span>
                      <span className="text-muted-foreground text-xs">{item.option.meta}</span>
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-muted-foreground text-xs"
                      title={`${item.option.people} ${item.option.people === 1 ? "person" : "people"} in the directory`}
                    >
                      <UsersIcon className="size-3" />
                      {item.option.people}
                    </span>
                  </>
                ) : (
                  <>
                    <PlusIcon className="size-4 text-muted-foreground" />
                    Add "{query.trim()}" as a new organization
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </InputGroup>
    </div>
  );
}
