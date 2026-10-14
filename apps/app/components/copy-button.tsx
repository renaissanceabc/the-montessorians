"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { withAccessDate } from "@/lib/citation";
import { cn } from "@/lib/utils";

const COPIED_MS = 1500;

/** Shared by the stacked icons of each state. */
const SWAP =
  "[grid-area:1/1] transition-[opacity,scale,filter] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]";
const SWAP_IN = "opacity-100 scale-100 blur-[0px]";
/** Reduced motion keeps the opacity crossfade and drops the scale and blur. */
const SWAP_OUT = "opacity-0 scale-50 blur-[2px] motion-reduce:scale-100 motion-reduce:blur-[0px]";

/**
 * An icon-only button that copies text (a record's permanent link, or its
 * citation with today's access date), then shows a check.
 */
export const CopyButton = ({
  text,
  label,
  citation = false,
  className,
}: {
  text: string;
  /** What gets copied, for the accessible name: "permanent link", "citation" */
  label: string;
  /** Append today's access date when copying */
  citation?: boolean;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const done = `Copied ${label}`;
  const action = `Copy ${label}`;

  return (
    <button
      aria-label={copied ? done : action}
      className={cn(
        "text-muted-foreground hover:text-foreground inline-grid size-8 shrink-0 place-items-center rounded-md transition-[color,background-color,scale] duration-150 ease-out hover:bg-black/5 active:scale-[0.94] motion-reduce:active:scale-100",
        className
      )}
      data-copied={copied}
      data-print-hidden
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(citation ? withAccessDate(text, new Date()) : text);
          setCopied(true);
        } catch {
          toast.error(`Couldn't copy the ${label}`);
        }
      }}
      title={copied ? "Copied" : action}
      type="button"
    >
      {/* Both icons stay mounted in one grid cell and crossfade. */}
      <CopyIcon aria-hidden="true" className={cn(SWAP, "size-3.5", copied ? SWAP_OUT : SWAP_IN)} />
      <CheckIcon
        aria-hidden="true"
        className={cn(SWAP, "size-4 text-green-700", copied ? SWAP_IN : SWAP_OUT)}
      />
      <span aria-live="polite" className="sr-only">
        {copied ? done : ""}
      </span>
    </button>
  );
};
