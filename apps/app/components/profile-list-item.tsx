import { BadgeCheckIcon, Building2Icon, GraduationCapIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { OrganizationRef, Profile } from "@/lib/content/types";
import { cn } from "@/lib/utils";

import { ProfilePhoto } from "./profile-photo";

/** Tags shown as badges on a card. */
const TAGS_SHOWN = 3;

const years = (profile: Profile) => {
  if (profile.birthYear && profile.deathYear) {
    return `${profile.birthYear}–${profile.deathYear}`;
  }
  if (profile.birthYear) {
    return `b. ${profile.birthYear}`;
  }
  return profile.deathYear ? `d. ${profile.deathYear}` : "";
};

const orgLabel = (ref: OrganizationRef) =>
  ref.organizationShortName ?? ref.organizationName ?? ref.organization;

const Dot = () => (
  <span aria-hidden="true" className="text-black/25">
    ·
  </span>
);

/**
 * A person as a card: photo, name, years and a verified mark, tagline, a meta
 * line (organization · works), and tag badges. Used in every directory grid
 * and list.
 */
const ProfileListItem = ({
  profile,
  detail,
  className,
  hideOrganization,
}: {
  profile: Profile;
  /** Context for where it's listed, e.g. their level or role at an organization */
  detail?: ReactNode;
  className?: string;
  /** Leave this organization out of the meta line, e.g. on that organization's own page. */
  hideOrganization?: string;
}) => {
  const isContributor = profile.kinds.includes("contributor");
  const orgs = (isContributor ? profile.affiliations : profile.schools).filter(
    (o) => o.organization !== hideOrganization
  );
  const OrgIcon = isContributor ? Building2Icon : GraduationCapIcon;
  const lifespan = years(profile);
  const works = profile.contributions.length;
  const tags = profile.tags.slice(0, TAGS_SHOWN).map((tag) => tag.label);

  const meta: { key: string; node: ReactNode }[] = [];
  if (orgs.length > 0) {
    meta.push({
      key: "org",
      node: (
        <span
          className="inline-flex min-w-0 items-center gap-1.5"
          title={orgs.map((o) => o.organizationName ?? o.organization).join(", ")}
        >
          <OrgIcon aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">{orgLabel(orgs[0])}</span>
          {orgs.length > 1 && <span className="shrink-0">+{orgs.length - 1}</span>}
        </span>
      ),
    });
  }
  if (isContributor && works > 0) {
    meta.push({
      key: "works",
      node: (
        <span className="shrink-0 tabular-nums">
          {works} {works === 1 ? "work" : "works"}
        </span>
      ),
    });
  }

  return (
    <Link
      className={cn(
        "group flex h-full min-w-0 gap-4 rounded-xl border border-black/8 bg-white/45 p-4 transition-[color,background-color,border-color,scale] duration-150 ease-out hover:border-black/15 hover:bg-white active:scale-[0.985] motion-reduce:active:scale-100",
        className
      )}
      href={`/${profile.slug}`}
    >
      <ProfilePhoto
        className="size-[72px]"
        initialClassName="text-3xl"
        name={profile.name}
        size={72}
        src={profile.imageUrl}
      />

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="type-name group-hover:text-primary min-w-0 transition-colors">
            {profile.name}
          </span>
          {(profile.verification === "verified" || profile.verification === "confirmed") && (
            <span
              className="inline-flex shrink-0 self-center"
              title={profile.verification === "verified" ? "Verified" : "Confirmed"}
            >
              <BadgeCheckIcon aria-hidden="true" className="fill-verified size-5 text-white" />
              <span className="sr-only">
                {profile.verification === "verified" ? "Verified" : "Confirmed"}
              </span>
            </span>
          )}
          {lifespan && <span className="type-meta tabular-nums">{lifespan}</span>}
        </span>
        {profile.tagline && (
          <span className="line-clamp-2 text-sm text-[#4A433D]">{profile.tagline}</span>
        )}
        {meta.length > 0 && (
          <span className="type-meta mt-0.5 flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
            {meta.map((item, i) => (
              <span className="flex min-w-0 items-center gap-1.5" key={item.key}>
                {i > 0 && <Dot />}
                {item.node}
              </span>
            ))}
          </span>
        )}
        {detail && <span className="type-meta">{detail}</span>}
        {tags.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-[#4A433D]"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </span>
        )}
      </span>
    </Link>
  );
};

export default ProfileListItem;
