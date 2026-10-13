"use client";

import { BookOpenIcon, Building2Icon, GraduationCapIcon, ShareIcon } from "lucide-react";
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
    return `${from}–`;
  }
  if (to) {
    return `–${to}`;
  }
  return "";
};

const orgLabel = (ref: OrganizationRef) =>
  ref.organizationShortName ?? ref.organizationName ?? ref.organization;

const Divider = () => (
  <span aria-hidden="true" className="px-1 text-black/25">
    ·
  </span>
);

/**
 * The profile header: photo beside the name with its verification badge, the
 * tagline, and one pill of facts with a share button.
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
    <header className="flex w-full min-w-0 flex-col gap-5">
      <div className="flex items-center gap-4 sm:gap-6">
        <ProfilePhoto
          alt={profile.name}
          className="size-20 sm:size-32"
          initialClassName="text-4xl sm:text-6xl"
          name={profile.name}
          preload
          size={128}
          src={profile.imageUrl}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <h1 className="type-title min-w-0">{profile.name}</h1>
            <VerificationBadge verification={profile.verification} />
          </div>
          {profile.tagline && <p className="type-lead hidden italic sm:block">{profile.tagline}</p>}
        </div>
      </div>

      {profile.tagline && <p className="type-lead italic sm:hidden">{profile.tagline}</p>}

      <div className="flex w-fit max-w-full items-center gap-1 rounded-full border border-black/10 bg-white/60 py-1 pr-1 pl-4 text-sm text-[#4A433D]">
        <span className="type-eyebrow shrink-0">{kindLabel}</span>

        {org && (
          <>
            <Divider />
            <Link
              className="inline-flex min-w-0 items-center gap-1.5 hover:underline"
              href={`/organizations/${org.organization}`}
              title={[org.organizationName, yearRange(org.from, org.to)].filter(Boolean).join(", ")}
            >
              {org === school ? (
                <GraduationCapIcon aria-hidden="true" className="size-3.5 shrink-0" />
              ) : (
                <Building2Icon aria-hidden="true" className="size-3.5 shrink-0" />
              )}
              <span className="truncate">{orgLabel(org)}</span>
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
            <span className="shrink-0 tabular-nums">{yearRange(school.from, school.to)}</span>
          </>
        )}

        {isContributor && profile.contributions.length > 0 && (
          <>
            <Divider />
            <a
              className="inline-flex shrink-0 items-center gap-1 hover:underline"
              href="#contributions"
              title={`${profile.contributions.length} documented contribution${profile.contributions.length === 1 ? "" : "s"}`}
            >
              <BookOpenIcon aria-hidden="true" className="size-3.5" />
              {profile.contributions.length}
            </a>
          </>
        )}

        <span aria-hidden="true" className="mx-1 h-4 w-px shrink-0 bg-black/12" data-print-hidden />

        <button
          aria-label="Share this profile"
          className="flex size-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/6"
          data-print-hidden
          onClick={() => setShareOpen(true)}
          type="button"
        >
          <ShareIcon aria-hidden="true" className="size-4" />
        </button>
        <ShareDialog onOpenChange={setShareOpen} open={shareOpen} profile={profile} />
      </div>

      {profile.imageCredit && <p className="type-meta">{profile.imageCredit}</p>}
    </header>
  );
};
