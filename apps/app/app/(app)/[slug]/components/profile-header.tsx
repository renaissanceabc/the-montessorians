import { BookOpenIcon, Building2Icon, CalendarIcon, GraduationCapIcon } from "lucide-react";
import Link from "next/link";

import { ProfilePhoto } from "@/components/profile-photo";
import { ShareButton } from "@/components/share-button";
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

        <ShareButton target={{ kind: "profile", name: profile.name, path: `/${profile.slug}` }} />
      </div>
    </header>
  );
};
