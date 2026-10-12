import { format, parseISO } from "date-fns";

import ProfileListItem from "@/components/profile-list-item";
import type { PastProfile } from "@/lib/content/types";

const PastProfilesList = ({ profiles }: { profiles: PastProfile[] }) => {
  if (profiles.length === 0) {
    return (
      <div className="text-muted-foreground text-sm italic">
        No Montessorians yet. Check back soon.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      {profiles.map((profile) => (
        <div className="flex flex-col gap-2" key={profile.featuredDate}>
          <div className="relative flex items-center justify-center">
            <div className="absolute top-1/2 left-0 -z-10 w-full border-t border-black/10" />
            <span className="bg-background text-muted-foreground z-10 px-3 text-center text-sm">
              {format(parseISO(profile.featuredDate), "MMMM d, yyyy")}
            </span>
          </div>

          <ProfileListItem profile={profile} />
        </div>
      ))}
    </div>
  );
};
export default PastProfilesList;
