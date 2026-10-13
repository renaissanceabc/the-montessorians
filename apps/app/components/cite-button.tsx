"use client";

import { CheckIcon, LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

const COPIED_MS = 1800;

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
        "data-[copied=true]:bg-secondary data-[copied=true]:text-secondary-foreground inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-black/6 px-2.5 text-[13px] font-medium transition-colors hover:bg-black/10 sm:px-3",
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
      {copied ? (
        <CheckIcon aria-hidden="true" className="size-3.5" />
      ) : (
        <LinkIcon aria-hidden="true" className="size-3.5" />
      )}
      <span aria-live="polite" className={cn(label === "Cite" && "max-sm:sr-only")}>
        {copied ? "Copied" : label}
      </span>
    </button>
  );
};
