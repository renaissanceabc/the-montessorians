import { SearchIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/content/types";

import FeaturedProfile from "./featured-profile";

const Hero = ({ dailyProfile }: { dailyProfile: Profile | null }) => (
  <section className="bg-black/5 py-12 lg:py-16">
    <Container className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
      <div className="flex max-w-xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="type-title">Discover extraordinary Montessorians</h1>
          <p className="type-lead max-w-md">
            Daily spotlight on Montessori alumni doing great things, and the people who shaped the
            field. <strong className="text-foreground font-semibold">Open source</strong>.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="shadow-none"
            nativeButton={false}
            render={<Link href="/discover" />}
            size="lg"
          >
            <SearchIcon aria-hidden="true" className="size-4" />
            Explore the directory
          </Button>

          <Button
            className="border-black/10 shadow-none"
            nativeButton={false}
            render={<Link href="/contribute" />}
            size="lg"
            variant="outline"
          >
            <UserPlusIcon aria-hidden="true" className="size-4" />
            Contribute
          </Button>
        </div>
      </div>

      <FeaturedProfile dailyProfile={dailyProfile} />
    </Container>
  </section>
);
export default Hero;
