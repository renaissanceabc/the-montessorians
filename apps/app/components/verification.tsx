"use client";

import { BadgeCheckIcon, InfoIcon, MessageCircleIcon, UserCheckIcon } from "lucide-react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Verification } from "@/lib/content/types";
import { POLICY_HREF, VERIFICATION_COPY } from "@/lib/content/verification";
import { cn } from "@/lib/utils";

/** The badge beside a person's name. */
export function VerificationBadge({
  verification,
  href = "#sources",
}: {
  verification: Verification | null;
  href?: string;
}) {
  if (!verification) {
    return null;
  }
  const copy = VERIFICATION_COPY[verification];
  const solid = verification === "verified" || verification === "confirmed";
  const Icon =
    verification === "confirmed"
      ? UserCheckIcon
      : verification === "reported"
        ? MessageCircleIcon
        : BadgeCheckIcon;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            aria-label={`${copy.label}: ${copy.description}`}
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-full transition-colors",
              solid
                ? "size-8 bg-secondary text-secondary-foreground hover:bg-secondary/85"
                : "h-7 gap-1 border border-black/20 px-2.5 font-medium text-muted-foreground text-xs hover:border-black/40"
            )}
            href={href}
          />
        }
      >
        {solid ? <Icon className="size-[18px]" /> : copy.label}
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <p className="text-pretty leading-snug">
          <span className="font-semibold">{copy.label}.</span> {copy.description}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

/** The (i) beside "Sources": explains all four states, links to the policy. */
export function HowWeVerify() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            aria-label="How we verify"
            className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground data-popup-open:bg-black/5"
            type="button"
          />
        }
      >
        <InfoIcon className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-80 flex-col gap-3 text-sm">
        <p className="font-semibold">How we verify</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-2">
          {(Object.keys(VERIFICATION_COPY) as Verification[]).map((key) => (
            <div className="contents" key={key}>
              <dt className="font-medium">{VERIFICATION_COPY[key].label}</dt>
              <dd className="text-muted-foreground">{VERIFICATION_COPY[key].description}</dd>
            </div>
          ))}
        </dl>
        <p className="text-muted-foreground text-xs">
          Unsourced "famous alumni" lists don't count. Every profile can be corrected.
        </p>
        <Link className="font-semibold text-sm hover:underline" href={POLICY_HREF}>
          Read the full policy →
        </Link>
      </PopoverContent>
    </Popover>
  );
}
