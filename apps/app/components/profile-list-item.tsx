import Link from "next/link";
import type { Profile } from "@/lib/content/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

export default function ProfileListItem({ profile }: { profile: Profile }) {
  const affiliation = profile.affiliations[0]?.organizationName;
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

      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full flex-col gap-1">
          <p className="font-semibold font-serif text-2xl group-hover:text-primary">
            {profile.name}
          </p>
          {profile.tagline && (
            <p className="text-muted-foreground text-xs sm:text-sm">{profile.tagline}</p>
          )}
          {profile.kind === "contributor" && (affiliation || profile.contributions.length > 0) && (
            <p className="text-muted-foreground text-xs">
              {[
                affiliation,
                profile.contributions.length > 0 &&
                  `${profile.contributions.length} documented contribution${profile.contributions.length === 1 ? "" : "s"}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {profile.tags.length > 0 &&
            profile.tags.slice(0, 3).map((tag) => (
              <Badge className="flex bg-white/50 text-xs" key={tag.slug} variant="outline">
                {tag.label}
              </Badge>
            ))}
        </div>
      </div>
    </Link>
  );
}
