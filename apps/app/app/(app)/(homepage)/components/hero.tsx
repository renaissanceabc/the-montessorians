import { SearchIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/content/types";

import FeaturedProfile from "./featured-profile";

const Hero = ({ dailyProfile }: { dailyProfile: Profile | null }) => (
  <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
    <div className="flex max-w-xl flex-col gap-7">
      <div className="flex flex-col gap-4">
        <h1 className="type-title lg:text-[3.75rem]">
          People shaped by Montessori, and the people who shaped it.
        </h1>
        <p className="type-lead max-w-lg">
          An open directory of Montessori alumni and the researchers, authors, and trainers behind
          the method. Every entry is sourced, and the data is free to use.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button
          className="h-11 px-4 shadow-none"
          nativeButton={false}
          render={<Link href="/discover" />}
          size="lg"
        >
          <SearchIcon aria-hidden="true" className="size-4" />
          <span className="sm:hidden">Explore</span>
          <span className="max-sm:hidden">Explore the directory</span>
        </Button>

        <Button
          className="text-foreground h-11 border-black/12 bg-white/60 px-4 shadow-none"
          nativeButton={false}
          render={<Link href="/contribute" />}
          size="lg"
          variant="outline"
        >
          <UserPlusIcon aria-hidden="true" className="size-4" />
          <span className="sm:hidden">Add someone</span>
          <span className="max-sm:hidden">Add a Montessorian</span>
        </Button>
      </div>
    </div>

    <FeaturedProfile dailyProfile={dailyProfile} />
  </section>
);
export default Hero;
