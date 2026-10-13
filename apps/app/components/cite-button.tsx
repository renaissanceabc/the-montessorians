"use client";

import { CheckIcon, LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

const COPIED_MS = 1800;

/** Shared by the stacked icon and label layers of each state. */
const SWAP =
  "[grid-area:1/1] transition-[opacity,scale,filter] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]";
const SWAP_IN = "opacity-100 scale-100 blur-0";
/** Reduced motion keeps the opacity crossfade and drops the scale and blur. */
const SWAP_OUT = "opacity-0 scale-50 blur-[2px] motion-reduce:scale-100 motion-reduce:blur-0";

/** Copies a record's permanent URI. */
export const CiteButton = ({
  url,
  label = "Cite",
  className,
}: {
  url: string;
  /** Visible label; hidden on phones when it's the short "Cite" */
  label?: string;
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

  return (
    <button
      aria-label={copied ? "Permanent link copied" : `${label}: copy the permanent link`}
      className={cn(
        "data-[copied=true]:bg-secondary data-[copied=true]:text-secondary-foreground inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-black/6 px-2.5 text-[13px] font-medium transition-[color,background-color,scale] duration-150 ease-out hover:bg-black/10 active:scale-[0.97] motion-reduce:active:scale-100 sm:px-3",
        className
      )}
      data-copied={copied}
      data-print-hidden
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        } catch {
          toast.error("Couldn't copy the link");
        }
      }}
      title={`Copy the permanent link: ${url.replace(/^https?:\/\//u, "")}`}
      type="button"
    >
      {/* Both states stay mounted in one grid cell and crossfade, so the
          button never changes width. */}
      <span aria-hidden="true" className="grid size-3.5 place-items-center">
        <LinkIcon className={cn(SWAP, "size-3.5", copied ? SWAP_OUT : SWAP_IN)} />
        <CheckIcon className={cn(SWAP, "size-3.5", copied ? SWAP_IN : SWAP_OUT)} />
      </span>
      <span
        aria-hidden="true"
        className={cn("grid place-items-center", label === "Cite" && "max-sm:hidden")}
      >
        <span className={cn(SWAP, copied ? SWAP_OUT : SWAP_IN)}>{label}</span>
        <span className={cn(SWAP, copied ? SWAP_IN : SWAP_OUT)}>Copied</span>
      </span>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied" : label}
      </span>
    </button>
  );
};
