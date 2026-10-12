import { BookOpenIcon, Building2Icon, GraduationCapIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { OrganizationRef, Profile } from "@/lib/content/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

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

export default function ProfileListItem({
  profile,
  detail,
}: {
  profile: Profile;
  /** Context for where it's listed, e.g. their level or role at an organization */
  detail?: ReactNode;
}) {
  const isContributor = profile.kinds.includes("contributor");
  const orgs = isContributor ? profile.affiliations : profile.schools;
  const OrgIcon = isContributor ? Building2Icon : GraduationCapIcon;
  const lifespan = years(profile);

  return (
    <Link
      className="group flex gap-4 rounded-lg border border-transparent p-4 transition-all duration-150 hover:border-black/10 hover:bg-white"
      href={`/${profile.slug}`}
      key={profile.slug}
    >
      <Avatar className="h-16 w-16 sm:h-24 sm:w-24">
        <AvatarImage alt={profile.name} src={profile.imageUrl ?? ""} />
        <AvatarFallback className="font-serif text-2xl">{profile.name.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className="flex w-full min-w-0 flex-col gap-2.5">
        <div className="flex w-full flex-col gap-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold font-serif text-2xl group-hover:text-primary">
              {profile.name}
            </span>
            {lifespan && (
              <span className="text-muted-foreground text-xs tabular-nums">{lifespan}</span>
            )}
            {profile.verification === "unverified" && (
              <span className="text-muted-foreground text-xs" title="No reliable source yet">
                Unverified
              </span>
            )}
          </p>
          {profile.tagline && (
            <p className="text-muted-foreground text-xs sm:text-sm">{profile.tagline}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[#4A433D] text-xs">
          {orgs.length > 0 && (
            <span
              className="inline-flex min-w-0 items-center gap-1.5"
              title={orgs.map((o) => o.organizationName ?? o.organization).join(", ")}
            >
              <OrgIcon className="size-3.5 shrink-0" />
              <span className="max-w-48 truncate">{orgLabel(orgs[0])}</span>
              {orgs.length > 1 && (
                <span className="rounded-full bg-black/7 px-1.5 text-[11px]">
                  +{orgs.length - 1}
                </span>
              )}
            </span>
          )}
          {isContributor && profile.contributions.length > 0 && (
            <span
              className="inline-flex items-center gap-1.5"
              title={`${profile.contributions.length} documented contribution${profile.contributions.length === 1 ? "" : "s"}`}
            >
              <BookOpenIcon className="size-3.5" />
              {profile.contributions.length}
            </span>
          )}
          {profile.tags.length > 0 && (
            <span className="flex flex-wrap gap-1">
              {profile.tags.slice(0, 3).map((tag) => (
                <Badge className="flex bg-white/50 text-xs" key={tag.slug} variant="outline">
                  {tag.label}
                </Badge>
              ))}
            </span>
          )}
        </div>
        {detail && <p className="text-muted-foreground text-xs">{detail}</p>}
      </div>
    </Link>
  );
}
