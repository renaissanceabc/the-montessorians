import { ArrowRightIcon, StarsIcon } from "lucide-react";
import Link from "next/link";

import { ProfilePhoto } from "@/components/profile-photo";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/lib/content/types";

const ArchiveLink = () => (
  <Link
    className="text-muted-foreground flex flex-row items-center gap-1 text-xs hover:underline"
    href="/archive"
  >
    See past Montessorians <ArrowRightIcon aria-hidden="true" className="size-3" />
  </Link>
);

const FeaturedProfile = ({ dailyProfile }: { dailyProfile: Profile | null }) => (
  <div className="flex w-full flex-col items-center gap-4 md:w-72 md:shrink-0">
    <h2 className="type-eyebrow text-foreground flex items-center gap-2">
      <StarsIcon aria-hidden="true" className="size-4" />
      Today&apos;s Montessorian
    </h2>

    {dailyProfile ? (
      <Link
        className="group flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-black/10 bg-white/50 p-5 transition-colors hover:bg-white"
        href={`/${dailyProfile.slug}`}
      >
        <ProfilePhoto
          className="size-28 lg:size-32"
          initialClassName="text-5xl"
          name={dailyProfile.name}
          preload
          size={128}
          src={dailyProfile.imageUrl}
        />

        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <span className="type-name group-hover:text-primary text-2xl transition-colors">
            {dailyProfile.name}
          </span>
          {dailyProfile.tagline && (
            <p className="text-muted-foreground line-clamp-3 text-sm">{dailyProfile.tagline}</p>
          )}
          {dailyProfile.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1">
              {dailyProfile.tags.slice(0, 3).map((tag) => (
                <Badge className="text-xs" key={tag.slug} variant="outline">
                  {tag.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Link>
    ) : (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-black/20 bg-white/50 p-5 text-center">
        <span className="type-name">No spotlight today</span>
        <p className="text-muted-foreground text-sm">Check back tomorrow for a new Montessorian.</p>
      </div>
    )}

    <ArchiveLink />
  </div>
);
export default FeaturedProfile;
