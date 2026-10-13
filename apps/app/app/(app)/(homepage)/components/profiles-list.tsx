import ProfileListItem from "@/components/profile-list-item";
import type { Profile } from "@/lib/content/types";

/** Recently added cards on the homepage. */
const RECENT_SHOWN = 6;

const ProfilesHomepageList = ({ profiles }: { profiles: Profile[] }) => {
  if (!profiles.length) {
    return (
      <div className="text-muted-foreground text-sm italic">
        No Montessorians yet. Check back soon!
      </div>
    );
  }

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {profiles.slice(0, RECENT_SHOWN).map((profile) => (
        <li className="min-w-0" key={profile.slug}>
          <ProfileListItem profile={profile} />
        </li>
      ))}
    </ul>
  );
};
export default ProfilesHomepageList;
