import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import ProfileListItem from "@/components/profile-list-item";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/content/types";

const ProfilesHomepageList = ({ profiles }: { profiles: Profile[] }) => {
  if (!profiles.length) {
    return (
      <div className="text-muted-foreground text-sm italic">
        No Montessorians yet. Check back soon!
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <ul className="grid gap-3 md:grid-cols-2">
        {profiles.slice(0, 10).map((profile) => (
          <li className="min-w-0" key={profile.slug}>
            <ProfileListItem profile={profile} />
          </li>
        ))}
      </ul>
      <div className="flex justify-center">
        <Button
          nativeButton={false}
          render={<Link className="text-sm font-semibold" href="/alumni" />}
        >
          See more Montessorians <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );
};
export default ProfilesHomepageList;
