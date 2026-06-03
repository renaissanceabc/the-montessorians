import { format, parseISO } from "date-fns";
import ProfileListItem from "@/components/profile-list-item";
import type { PastProfile } from "@/lib/content/types";

export default function PastProfilesList({ profiles }: { profiles: PastProfile[] }) {
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
            <div className="-z-10 absolute top-1/2 left-0 w-full border-black/10 border-t" />
            <span className="z-10 bg-background px-3 text-center text-muted-foreground text-sm">
              {format(parseISO(profile.featuredDate), "MMMM d, yyyy")}
            </span>
          </div>

          <ProfileListItem profile={profile} />
        </div>
      ))}
    </div>
  );
}
