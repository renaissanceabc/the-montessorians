import Link from "next/link";
import { proxyImage } from "@/lib/utils";
import type { Profile } from "@/trpc/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

export default function ProfileListItem({ profile }: { profile: Profile }) {
  return (
    <Link
      className="group flex gap-4 rounded-lg border border-transparent p-4 transition-all duration-150 hover:border-black/10 hover:bg-white"
      href={`/${profile.slug}`}
      key={profile.slug}
    >
      <Avatar className="h-16 w-16 sm:h-24 sm:w-24">
        <AvatarImage alt={profile.name} src={proxyImage(profile.imageUrl ?? "")} />
        <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full flex-col gap-1">
          <p className="font-semibold font-serif text-2xl group-hover:text-primary">
            {profile.name}
          </p>
          {profile.tagline && (
            <p className="text-muted-foreground text-xs sm:text-sm">{profile.tagline}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-1 sm:gap-2">
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
