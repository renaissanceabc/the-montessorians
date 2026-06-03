import { ArrowRightIcon, StarsIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { proxyImage } from "@/lib/utils";
import type { Profile } from "@/trpc/types";

export default function FeaturedProfile({ dailyProfile }: { dailyProfile: Profile | null }) {
  if (!dailyProfile) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h1 className="flex items-center gap-2 font-bold text-xs">
          <StarsIcon className="h-4 w-4" />
          Today's Montessorian
        </h1>

        <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-black/20 bg-white/50 p-4 transition-colors sm:w-[320px] lg:w-[240px]">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="font-semibold font-serif text-2xl group-hover:text-primary">
              Oops – no daily profile found!
            </span>
          </div>
        </div>

        <Link
          className="flex flex-row items-center gap-1 text-muted-foreground text-xs hover:underline"
          href="/archive"
        >
          See past Montessorians <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="flex items-center gap-2 font-bold text-xs">
        <StarsIcon className="h-4 w-4" />
        Today's Montessorian
      </h1>

      <Link
        className="group flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-black/10 bg-white/50 p-4 transition-colors hover:bg-stone-50 sm:w-[320px] lg:w-[240px]"
        href={`/${dailyProfile.slug}`}
      >
        <Avatar className="h-24 w-24 rounded-full lg:h-32 lg:w-32">
          <AvatarImage alt={dailyProfile.name} src={proxyImage(dailyProfile.imageUrl ?? "")} />
          <AvatarFallback>{dailyProfile.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-semibold font-serif text-2xl group-hover:text-primary">
            {dailyProfile.name}
          </span>
          <p className="text-muted-foreground text-sm">{dailyProfile.tagline}</p>
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
            {dailyProfile.tags.slice(0, 3).map((tag) => (
              <Badge className="text-xs" key={tag.slug} variant="outline">
                {tag.label}
              </Badge>
            ))}
          </div>
        </div>
      </Link>

      <Link
        className="flex flex-row items-center gap-1 text-muted-foreground text-xs hover:underline"
        href="/archive"
      >
        See past Montessorians <ArrowRightIcon className="h-3 w-3" />
      </Link>
    </div>
  );
}
