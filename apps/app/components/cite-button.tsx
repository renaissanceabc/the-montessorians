"use client";

import { CheckIcon, LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/** Copies a record's permanent URI. */
export const CiteButton = ({ url }: { url: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      aria-label={copied ? "Citation link copied" : "Copy citation link"}
      className="data-[copied=true]:bg-secondary data-[copied=true]:text-secondary-foreground inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-black/6 px-2.5 text-[13px] font-medium transition-colors hover:bg-black/10 sm:px-3"
      data-copied={copied}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          toast.error("Couldn't copy the link");
        }
      }}
      title={`Copy citation link: ${url.replace(/^https?:\/\//u, "")}`}
      type="button"
    >
      {copied ? <CheckIcon className="size-3.5" /> : <LinkIcon className="size-3.5" />}
      <span className="max-sm:sr-only">{copied ? "Copied" : "Cite"}</span>
    </button>
  );
};
