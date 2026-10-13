import { SearchXIcon } from "lucide-react";

import ProfileListItem from "@/components/profile-list-item";
import type { Profile } from "@/lib/content/types";

/** People as cards: two columns from md, one on phones. */
const ProfilesList = ({ profiles, hasSearch }: { profiles: Profile[]; hasSearch: boolean }) => {
  if (profiles.length === 0) {
    return (
      <div className="text-muted-foreground flex min-h-64 flex-col items-center justify-center gap-4 py-12 text-sm italic">
        <SearchXIcon aria-hidden="true" className="size-16" />
        {hasSearch
          ? "No Montessorians found. Try a different search."
          : "No Montessorians yet. Check back soon."}
      </div>
    );
  }

  return (
    <ul className="grid w-full content-start gap-3 md:grid-cols-2">
      {profiles.map((profile) => (
        <li className="min-w-0" key={profile.slug}>
          <ProfileListItem profile={profile} />
        </li>
      ))}
    </ul>
  );
};
export default ProfilesList;
