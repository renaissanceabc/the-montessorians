import Link from "next/link";

import { ProfilePhoto } from "@/components/profile-photo";
import { CONTRIBUTOR_ROLE_LABELS } from "@/lib/content/types";
import type { Profile } from "@/lib/content/types";

import SectionHeader from "./section-header";

/**
 * A row of small portraits for the people who shaped the field. The photos
 * stay smaller than the alumni cards' so alumni remain the focus. On phones
 * the row scrolls sideways inside its own box, bleeding to the screen edges.
 */
const ContributorsBand = ({ contributors }: { contributors: Profile[] }) => {
  if (contributors.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="home-contributors" className="flex flex-col gap-6">
      <SectionHeader
        action="All contributors"
        href="/contributors"
        id="home-contributors"
        lead="Researchers, authors, and trainers with documented contributions."
        shortAction="All"
        title="The people who shaped the field"
      />
      <ul className="flex gap-2 max-sm:-mx-(--gutter) max-sm:overflow-x-auto max-sm:px-(--gutter) max-sm:[scrollbar-width:none] sm:grid sm:grid-cols-3 sm:gap-y-6 md:grid-cols-6 max-sm:[&::-webkit-scrollbar]:hidden">
        {contributors.map((profile) => {
          const [role] = profile.roles;
          return (
            <li className="w-[84px] shrink-0 sm:w-auto" key={profile.slug}>
              <Link
                className="group flex flex-col items-center gap-2 rounded-xl p-1 text-center"
                href={`/${profile.slug}`}
              >
                <ProfilePhoto
                  className="size-14"
                  initialClassName="text-2xl"
                  name={profile.name}
                  size={56}
                  src={profile.imageUrl}
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-foreground group-hover:text-primary text-sm leading-tight font-semibold text-balance transition-colors">
                    {profile.name}
                  </span>
                  {role && (
                    <span className="text-muted-foreground text-xs">
                      {CONTRIBUTOR_ROLE_LABELS[role]}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
export default ContributorsBand;
