"use client";

import {
  BookOpenIcon,
  Building2Icon,
  GraduationCapIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ShareIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CiteButton } from "@/components/cite-button";
import { ShareDialog } from "@/components/share-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
 * The profile header: photo, name with its verification badge, tagline, and one
 * pill of facts with the actions people use most (Cite visible, the rest in "…").
 */
export const ProfileHeader = ({
  profile,
  permanentUrl,
  correctionUrl,
}: {
  profile: Profile;
  permanentUrl: string;
  correctionUrl: string;
}) => {
  const isContributor = profile.kinds.includes("contributor");
  const kindLabel = profile.kinds.map((k) => (k === "alum" ? "Alum" : "Contributor")).join(" · ");
  const [school] = profile.schools;
  const [affiliation] = profile.affiliations;
  const org = isContributor ? affiliation : (school ?? affiliation);
  const extraOrgs = isContributor ? profile.affiliations.length - 1 : 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <Avatar className="size-40 rounded-full border border-black/10 sm:size-44">
          <AvatarImage alt={profile.name} src={profile.imageUrl ?? ""} />
          <AvatarFallback className="font-serif text-6xl">
            {profile.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {profile.imageCredit && (
          <p className="text-muted-foreground max-w-xs text-xs">{profile.imageCredit}</p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2.5">
        <h1 className="font-serif text-4xl leading-tight font-semibold">{profile.name}</h1>
        <VerificationBadge verification={profile.verification} />
      </div>

      {profile.tagline && (
        <p className="text-muted-foreground max-w-xl text-lg italic">{profile.tagline}</p>
      )}

      <div className="flex max-w-full items-center justify-center gap-1 rounded-full border border-black/10 bg-white/60 py-1 pr-1 pl-4 text-sm text-[#4A433D]">
        <span className="text-muted-foreground shrink-0 text-[11px] font-semibold tracking-wider uppercase">
          {kindLabel}
        </span>

        {org && (
          <>
            <Divider />
            <Link
              className="inline-flex min-w-0 items-center gap-1.5 hover:underline"
              href={`/organizations/${org.organization}`}
              title={[org.organizationName, yearRange(org.from, org.to)].filter(Boolean).join(", ")}
            >
              {org === school ? (
                <GraduationCapIcon className="size-3.5 shrink-0" />
              ) : (
                <Building2Icon className="size-3.5 shrink-0" />
              )}
              <span className="max-w-24 truncate sm:max-w-52">{orgLabel(org)}</span>
              {extraOrgs > 0 && (
                <span className="rounded-full bg-black/7 px-1.5 text-[11px]">+{extraOrgs}</span>
              )}
            </Link>
          </>
        )}

        {!isContributor && school && (school.from || school.to) && (
          <>
            <Divider />
            <span className="tabular-nums">{yearRange(school.from, school.to)}</span>
          </>
        )}

        {isContributor && profile.contributions.length > 0 && (
          <>
            <Divider />
            <a
              className="inline-flex items-center gap-1 hover:underline"
              href="#contributions"
              title={`${profile.contributions.length} documented contribution${profile.contributions.length === 1 ? "" : "s"}`}
            >
              <BookOpenIcon className="size-3.5" />
              {profile.contributions.length}
            </a>
          </>
        )}

        <span aria-hidden="true" className="mx-1 h-4 w-px shrink-0 bg-black/12" />

        <CiteButton url={permanentUrl} />

        <Popover onOpenChange={setMenuOpen} open={menuOpen}>
          <PopoverTrigger
            render={
              <button
                aria-label="More actions"
                className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-black/6 data-popup-open:bg-black/8"
                type="button"
              />
            }
          >
            <MoreHorizontalIcon className="size-4" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 gap-0.5 p-1">
            <button
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-black/5"
              onClick={() => {
                setMenuOpen(false);
                setShareOpen(true);
              }}
              type="button"
            >
              <ShareIcon className="text-muted-foreground size-4" />
              Share this profile
            </button>
            <Link
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-black/5"
              href={correctionUrl}
              onClick={() => setMenuOpen(false)}
              target="_blank"
            >
              <PencilIcon className="text-muted-foreground size-4" />
              Suggest a correction
            </Link>
          </PopoverContent>
        </Popover>
        <ShareDialog onOpenChange={setShareOpen} open={shareOpen} profile={profile} />
      </div>
    </div>
  );
};
