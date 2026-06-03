import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import ProfileListItem from "@/components/profile-list-item";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/content/types";

export default function ProfilesHomepageList({ profiles }: { profiles: Profile[] }) {
  if (!profiles.length) {
    return (
      <div className="text-muted-foreground text-sm italic">
        No Montessorians yet. Check back soon!
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-1 sm:gap-2">
      {profiles.slice(0, 10).map((profile) => (
        <ProfileListItem key={profile.slug} profile={profile} />
      ))}
      <div className="flex justify-center pt-4">
        <Button asChild>
          <Link className="font-semibold text-sm" href="/discover">
            See more Montessorians <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
