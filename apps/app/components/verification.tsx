"use client";

import { BadgeCheckIcon, InfoIcon } from "lucide-react";
import Link from "next/link";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Verification } from "@/lib/content/types";
import { POLICY_HREF, VERIFICATION_COPY } from "@/lib/content/verification";
import { cn } from "@/lib/utils";

/** The badge beside a person's name. */
export const VerificationBadge = ({
  verification,
  href = "#sources",
  className,
}: {
  verification: Verification | null;
  href?: string;
  className?: string;
}) => {
  if (!verification) {
    return null;
  }
  const copy = VERIFICATION_COPY[verification];
  const solid = verification === "verified" || verification === "confirmed";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            aria-label={`${copy.label}: ${copy.description}`}
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-full font-sans tracking-normal transition-colors",
              solid
                ? "size-10 transition-opacity hover:opacity-80"
                : "text-muted-foreground h-7 gap-1 border border-black/20 px-2.5 text-xs font-medium hover:border-black/40",
              className
            )}
            href={href}
          />
        }
      >
        {solid ? <BadgeCheckIcon className="fill-verified size-8 text-white" /> : copy.label}
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <p className="leading-snug text-pretty">
          <span className="font-semibold">{copy.label}.</span> {copy.description}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

/**
 * The (i) beside "Sources": a link to the editorial policy, with a one-line hint on
 * hover and focus. The link itself stays reachable by touch and keyboard.
 */
export const HowWeVerify = () => (
  <Tooltip>
    <TooltipTrigger
      render={
        <Link
          aria-label="How we verify profiles: read the editorial policy"
          className="text-muted-foreground hover:text-foreground flex size-6 items-center justify-center rounded-full transition-colors hover:bg-black/5"
          href={POLICY_HREF}
        />
      }
    >
      <InfoIcon aria-hidden="true" className="size-3.5" />
    </TooltipTrigger>
    <TooltipContent className="max-w-64">
      <p className="leading-snug text-pretty">How we verify profiles: read the editorial policy.</p>
    </TooltipContent>
  </Tooltip>
);
