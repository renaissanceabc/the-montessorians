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
    <ol className="grid w-full gap-x-3 gap-y-6 md:grid-cols-2">
      {profiles.map((profile) => (
        <li className="flex min-w-0 flex-col gap-2" key={profile.featuredDate}>
          <time className="type-eyebrow" dateTime={profile.featuredDate}>
            {format(parseISO(profile.featuredDate), "MMMM d, yyyy")}
          </time>
          <ProfileListItem className="flex-1" profile={profile} />
        </li>
      ))}
    </ol>
  );
};
export default PastProfilesList;
