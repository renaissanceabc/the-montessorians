import Contribute from "@/components/contribute";
import type { PastProfile } from "@/lib/content/types";

import PastProfilesList from "./past-profiles-list";

export const PastProfilesPageWrapper = ({ profiles }: { profiles: PastProfile[] }) => (
  <>
    <div className="container mx-auto max-w-screen-md items-center justify-between gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full space-y-8">
        <h1 className="flex w-full justify-center font-serif text-4xl font-bold lg:text-5xl">
          Spotlight Archive
        </h1>

        <PastProfilesList profiles={profiles} />
      </div>
    </div>

    <Contribute />
  </>
);
