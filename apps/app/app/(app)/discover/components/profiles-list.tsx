import { SearchXIcon } from "lucide-react";

import ProfileListItem from "@/components/profile-list-item";
import type { Profile } from "@/lib/content/types";

const ProfilesList = ({ profiles, hasSearch }: { profiles: Profile[]; hasSearch: boolean }) => {
  if (profiles.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center gap-4 text-sm italic">
        <SearchXIcon className="h-16 w-16" />
        {hasSearch
          ? "No Montessorians found. Try a different search."
          : "No Montessorians yet. Check back soon."}
      </div>
    );
  }

  return (
    <div className="flex min-h-[500px] w-full flex-col gap-2">
      {profiles.map((profile) => (
        <ProfileListItem key={profile.slug} profile={profile} />
      ))}
    </div>
  );
};
export default ProfilesList;
