"use client";

import { XIcon } from "lucide-react";
import { useId, useMemo, useState } from "react";

import type { Tag } from "@/lib/content/types";
import { cn, toTitleCase } from "@/lib/utils";

const MAX_SUGGESTIONS = 6;

/** Tags as chips. Existing tags are suggested first so the list stays short. */
export const TagInput = ({
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
}) => {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  // Closed by Escape or leaving the field; typing opens it again.
  const [dismissed, setDismissed] = useState(false);
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
  const open = matches.length > 0 && !dismissed;

  const add = (label: string) => {
    const clean = toTitleCase(label.trim().replace(/,$/u, ""));
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
          "border-input focus-within:border-ring focus-within:ring-ring/50 flex min-h-10 flex-wrap items-center gap-1 rounded-md border bg-white/80 px-2 py-1.5 shadow-xs transition-[color,box-shadow] focus-within:ring-3",
          invalid && "border-destructive ring-destructive/20 ring-3"
        )}
      >
        {value.map((tag) => (
          <span
            className="bg-muted inline-flex items-center gap-1 rounded py-0.5 pr-0.5 pl-2 text-[13px]"
            key={tag}
          >
            {tag}
            <button
              aria-label={`Remove ${tag}`}
              className="text-muted-foreground hover:text-foreground flex size-5 items-center justify-center rounded hover:bg-black/5"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              type="button"
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          aria-activedescendant={open ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-label="Add a tag"
          className="placeholder:text-muted-foreground h-7 min-w-32 flex-1 bg-transparent px-1 text-base outline-none md:text-sm"
          id={id}
          onBlur={() => setDismissed(true)}
          onChange={(e) => {
            setDismissed(false);
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
              if (open) {
                add(matches[active].label);
              } else if (q) {
                add(query);
              }
            } else if (e.key === "Escape" && open) {
              // Close the list, keep the text.
              e.preventDefault();
              setDismissed(true);
            } else if (e.key === "Backspace" && !query && value.length) {
              onChange(value.slice(0, -1));
            } else if (e.key === "ArrowDown" && matches.length) {
              e.preventDefault();
              setDismissed(false);
              setActive((a) => (open ? (a + 1) % matches.length : 0));
            } else if (e.key === "ArrowUp" && open) {
              e.preventDefault();
              setActive((a) => (a - 1 + matches.length) % matches.length);
            }
          }}
          placeholder={value.length ? "" : placeholder}
          role="combobox"
          value={query}
        />
      </div>
      {open && (
        <ul
          className="bg-popover text-popover-foreground ring-foreground/10 absolute inset-x-0 top-full z-20 mt-1 rounded-lg p-1 shadow-md ring-1"
          id={listId}
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/prefer-tag-over-role -- ARIA combobox popup: a native <select>/<datalist> cannot render the custom rows or keep focus in the text input.
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
              // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/prefer-tag-over-role -- option row of the ARIA combobox listbox above; a native <option> cannot hold this markup.
              role="option"
            >
              {tag.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
