import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { ProfilePhoto } from "@/components/profile-photo";
import type { Profile } from "@/lib/content/types";

const CARD = "flex w-full flex-col items-center rounded-2xl border border-black/8 bg-white/55 p-7";

const ArchiveLink = () => (
  <Link
    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs hover:underline"
    href="/archive"
  >
    See past Montessorians <ArrowRightIcon aria-hidden="true" className="size-3" />
  </Link>
);

/** "Today's Montessorian": the daily alumni spotlight beside the hero. */
const FeaturedProfile = ({ dailyProfile }: { dailyProfile: Profile | null }) => (
  <div className="flex w-full flex-col items-center gap-3 max-lg:mx-auto max-lg:max-w-[400px]">
    {dailyProfile ? (
      <Link
        aria-labelledby="todays-montessorian"
        className={`${CARD} group gap-4 text-center transition-[background-color,border-color,scale] duration-150 ease-out hover:border-black/15 hover:bg-white active:scale-[0.985] motion-reduce:active:scale-100`}
        href={`/${dailyProfile.slug}`}
      >
        <span className="type-eyebrow" id="todays-montessorian">
          Today&apos;s Montessorian
          <span className="sr-only">: {dailyProfile.name}</span>
        </span>
        <ProfilePhoto
          className="size-28 lg:size-40"
          initialClassName="text-5xl lg:text-6xl"
          name={dailyProfile.name}
          preload
          size={160}
          src={dailyProfile.imageUrl}
        />
        <span className="flex min-w-0 flex-col items-center gap-2">
          <span className="type-name group-hover:text-primary text-[1.75rem] transition-colors">
            {dailyProfile.name}
          </span>
          {dailyProfile.tagline && (
            <span className="line-clamp-3 text-[15px] text-pretty text-[#4A433D]">
              {dailyProfile.tagline}
            </span>
          )}
        </span>
        <span className="text-primary flex items-center gap-1 text-sm font-semibold group-hover:underline">
          Read the profile <ArrowRightIcon aria-hidden="true" className="size-4" />
        </span>
      </Link>
    ) : (
      <div className={`${CARD} gap-3 text-center`}>
        <span className="type-eyebrow">Today&apos;s Montessorian</span>
        <span className="type-name">No spotlight today</span>
        <p className="text-muted-foreground text-sm">Check back tomorrow for a new Montessorian.</p>
      </div>
    )}

    <ArchiveLink />
  </div>
);
export default FeaturedProfile;
