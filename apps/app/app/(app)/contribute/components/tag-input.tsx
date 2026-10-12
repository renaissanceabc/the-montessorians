"use client";

import { XIcon } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { Tag } from "@/lib/content/types";
import { cn, toTitleCase } from "@/lib/utils";

const MAX_SUGGESTIONS = 6;

/** Tags as chips. Existing tags are suggested first so the list stays short. */
export function TagInput({
  value,
  onChange,
  suggestions,
  placeholder,
  id,
  invalid,
}: {
  id?: string;
  invalid?: boolean;
  value: string[];
  onChange: (value: string[]) => void;
  suggestions: Tag[];
  placeholder: string;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const q = query.trim().toLowerCase();

  const matches = useMemo(
    () =>
      q
        ? suggestions
            .filter((t) => !value.includes(t.label) && t.label.toLowerCase().includes(q))
            .slice(0, MAX_SUGGESTIONS)
        : [],
    [q, suggestions, value]
  );

  const add = (label: string) => {
    const clean = toTitleCase(label.trim().replace(/,$/, ""));
    if (clean && !value.includes(clean)) {
      onChange([...value, clean]);
    }
    setQuery("");
    setActive(0);
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1 rounded-md border border-input bg-white/80 px-2 py-1.5 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
          invalid && "border-destructive ring-3 ring-destructive/20"
        )}
      >
        {value.map((tag) => (
          <span
            className="inline-flex items-center gap-1 rounded bg-muted py-0.5 pr-0.5 pl-2 text-[13px]"
            key={tag}
          >
            {tag}
            <button
              aria-label={`Remove ${tag}`}
              className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-black/5 hover:text-foreground"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              type="button"
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          aria-activedescendant={matches.length ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={matches.length > 0}
          aria-invalid={invalid || undefined}
          aria-label="Add a tag"
          className="h-7 min-w-32 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
          id={id}
          onChange={(e) => {
            if (e.target.value.endsWith(",")) {
              add(e.target.value);
            } else {
              setQuery(e.target.value);
              setActive(0);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (matches.length) {
                add(matches[active].label);
              } else if (q) {
                add(query);
              }
            } else if (e.key === "Backspace" && !query && value.length) {
              onChange(value.slice(0, -1));
            } else if (e.key === "ArrowDown" && matches.length) {
              e.preventDefault();
              setActive((a) => (a + 1) % matches.length);
            } else if (e.key === "ArrowUp" && matches.length) {
              e.preventDefault();
              setActive((a) => (a - 1 + matches.length) % matches.length);
            }
          }}
          placeholder={value.length ? "" : placeholder}
          role="combobox"
          value={query}
        />
      </div>
      {matches.length > 0 && (
        <ul
          className="absolute inset-x-0 top-full z-20 mt-1 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
          id={listId}
          role="listbox"
        >
          {matches.map((tag, i) => (
            <li
              aria-selected={i === active}
              className={cn(
                "cursor-pointer rounded-md px-2.5 py-1.5 text-sm",
                i === active && "bg-black/5"
              )}
              id={`${listId}-${i}`}
              key={tag.slug}
              onMouseDown={(e) => {
                e.preventDefault();
                add(tag.label);
              }}
              onMouseEnter={() => setActive(i)}
              role="option"
            >
              {tag.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
