"use client";

import {
  BookOpenIcon,
  Building2Icon,
  CalendarIcon,
  GraduationCapIcon,
  ShareIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ProfilePhoto } from "@/components/profile-photo";
import { ShareDialog } from "@/components/share-dialog";
import { VerificationBadge } from "@/components/verification";
import type { OrganizationRef, Profile } from "@/lib/content/types";

const yearRange = (from?: number, to?: number) => {
  if (from && to) {
    return from === to ? `${from}` : `${from}–${to}`;
  }
  if (from) {
    return `Since ${from}`;
  }
  if (to) {
    return `Until ${to}`;
  }
  return "";
};

const orgLabel = (ref: OrganizationRef) =>
  ref.organizationShortName ?? ref.organizationName ?? ref.organization;

// Separators only inside the single-line pill; on phones the facts wrap freely.
const Divider = () => (
  <span aria-hidden="true" className="px-1 text-black/25 max-sm:hidden">
    ·
  </span>
);

/**
 * The profile header: photo beside the name with its verification badge, the
 * tagline, the facts (a pill on larger screens), and a share button that floats
 * at the bottom on phones.
 */
export const ProfileHeader = ({ profile }: { profile: Profile }) => {
  const isContributor = profile.kinds.includes("contributor");
  const kindLabel = profile.kinds.map((k) => (k === "alum" ? "Alum" : "Contributor")).join(" · ");
  const [school] = profile.schools;
  const [affiliation] = profile.affiliations;
  const org = isContributor ? affiliation : (school ?? affiliation);
  const extraOrgs = isContributor ? profile.affiliations.length - 1 : 0;
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <header className="flex w-full min-w-0 flex-col gap-5 max-sm:items-center max-sm:text-center">
      {/* Phones: photo on its own row and the header centered; larger screens: photo beside the name. */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <ProfilePhoto
          alt={profile.name}
          className="size-28 sm:size-32"
          initialClassName="text-4xl sm:text-6xl"
          name={profile.name}
          preload
          size={128}
          src={profile.imageUrl}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex min-w-0 items-center gap-2.5 max-sm:justify-center">
            <h1 className="type-title min-w-0">{profile.name}</h1>
            <VerificationBadge verification={profile.verification} />
          </div>
          {profile.tagline && <p className="type-lead hidden italic sm:block">{profile.tagline}</p>}
        </div>
      </div>

      {profile.tagline && (
        <p className="type-lead -mt-2 text-balance italic sm:hidden">{profile.tagline}</p>
      )}

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
        {/* Phones: unboxed facts that wrap, nothing cut off; larger screens: one pill. */}
        <div className="flex max-w-full flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[#4A433D] max-sm:justify-center sm:w-fit sm:gap-x-0 sm:rounded-3xl sm:border sm:border-black/10 sm:bg-white/60 sm:px-4 sm:py-1.5">
          <span className="type-eyebrow shrink-0 max-sm:basis-full">{kindLabel}</span>

          {org && (
            <>
              <Divider />
              <Link
                className="inline-flex min-w-0 items-center gap-1.5 hover:underline"
                href={`/organizations/${org.organization}`}
                title={org.organizationName ?? org.organization}
              >
                {org === school ? (
                  <GraduationCapIcon aria-hidden="true" className="size-3.5 shrink-0" />
                ) : (
                  <Building2Icon aria-hidden="true" className="size-3.5 shrink-0" />
                )}
                <span>{orgLabel(org)}</span>
                {extraOrgs > 0 && (
                  <span className="shrink-0 rounded-full bg-black/7 px-1.5 text-[11px]">
                    +{extraOrgs}
                  </span>
                )}
              </Link>
            </>
          )}

          {!isContributor && school && (school.from || school.to) && (
            <>
              <Divider />
              <span className="inline-flex shrink-0 items-center gap-1.5 tabular-nums">
                <CalendarIcon aria-hidden="true" className="size-3.5 sm:hidden" />
                {yearRange(school.from, school.to)}
              </span>
            </>
          )}

          {isContributor && profile.contributions.length > 0 && (
            <>
              <Divider />
              <a
                className="inline-flex shrink-0 items-center gap-1.5 hover:underline"
                href="#contributions"
              >
                <BookOpenIcon aria-hidden="true" className="size-3.5" />
                {profile.contributions.length}{" "}
                {profile.contributions.length === 1 ? "work" : "works"}
              </a>
            </>
          )}
        </div>

        {/* Share: floating at the bottom on phones (like the directory's filter bar); inline otherwise. */}
        <div
          className="max-sm:fixed max-sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] max-sm:left-1/2 max-sm:z-40 max-sm:-translate-x-1/2 max-sm:rounded-full max-sm:bg-white/95 max-sm:p-1 max-sm:shadow-[0_8px_30px_rgba(0,0,0,0.12)] max-sm:ring-1 max-sm:ring-black/10"
          data-print-hidden
        >
          <button
            className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-[background-color,scale] duration-150 ease-out hover:bg-black/6 active:scale-[0.97] motion-reduce:active:scale-100 sm:h-8 sm:border sm:border-black/10 sm:bg-white/60 sm:px-3"
            onClick={() => setShareOpen(true)}
            type="button"
          >
            <ShareIcon aria-hidden="true" className="size-4" />
            Share
          </button>
        </div>
        <ShareDialog onOpenChange={setShareOpen} open={shareOpen} profile={profile} />
      </div>

      {profile.imageCredit && <p className="type-meta">{profile.imageCredit}</p>}
    </header>
  );
};
