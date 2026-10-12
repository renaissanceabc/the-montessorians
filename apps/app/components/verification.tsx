"use client";

import { BadgeCheckIcon, InfoIcon, MessageCircleIcon, UserCheckIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Verification } from "@/lib/content/types";
import { POLICY_HREF, VERIFICATION_COPY } from "@/lib/content/verification";
import { cn } from "@/lib/utils";

const VERIFICATION_ICONS: Record<Verification, LucideIcon> = {
  confirmed: UserCheckIcon,
  reported: MessageCircleIcon,
  unverified: BadgeCheckIcon,
  verified: BadgeCheckIcon,
};

/** The badge beside a person's name. */
export const VerificationBadge = ({
  verification,
  href = "#sources",
}: {
  verification: Verification | null;
  href?: string;
}) => {
  if (!verification) {
    return null;
  }
  const copy = VERIFICATION_COPY[verification];
  const solid = verification === "verified" || verification === "confirmed";
  const Icon = VERIFICATION_ICONS[verification];

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            aria-label={`${copy.label}: ${copy.description}`}
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-full transition-colors",
              solid
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/85 size-8"
                : "text-muted-foreground h-7 gap-1 border border-black/20 px-2.5 text-xs font-medium hover:border-black/40"
            )}
            href={href}
          />
        }
      >
        {solid ? <Icon className="size-[18px]" /> : copy.label}
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <p className="leading-snug text-pretty">
          <span className="font-semibold">{copy.label}.</span> {copy.description}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

/** The (i) beside "Sources": explains all four states, links to the policy. */
export const HowWeVerify = () => (
  <Popover>
    <PopoverTrigger
      render={
        <button
          aria-label="How we verify"
          className="text-muted-foreground hover:text-foreground flex size-6 items-center justify-center rounded-full transition-colors hover:bg-black/5 data-popup-open:bg-black/5"
          type="button"
        />
      }
    >
      <InfoIcon className="size-3.5" />
    </PopoverTrigger>
    <PopoverContent align="start" className="flex w-80 flex-col gap-3 text-sm">
      <p className="font-semibold">How we verify</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-2">
        {
          // SAFETY: VERIFICATION_COPY is typed Record<Verification, ...>, so its own keys are exactly the Verification values.
          (Object.keys(VERIFICATION_COPY) as Verification[]).map((key) => (
            <div className="contents" key={key}>
              <dt className="font-medium">{VERIFICATION_COPY[key].label}</dt>
              <dd className="text-muted-foreground">{VERIFICATION_COPY[key].description}</dd>
            </div>
          ))
        }
      </dl>
      <p className="text-muted-foreground text-xs">
        Unsourced &quot;famous alumni&quot; lists don&apos;t count. Every profile can be corrected.
      </p>
      <Link className="text-sm font-semibold hover:underline" href={POLICY_HREF}>
        Read the full policy →
      </Link>
    </PopoverContent>
  </Popover>
);
