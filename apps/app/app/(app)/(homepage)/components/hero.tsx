import { LayoutGridIcon } from "lucide-react";
import Link from "next/link";
import { GitHubIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/trpc/types";
import FeaturedProfile from "./featured-profile";

export default function Hero({ dailyProfile }: { dailyProfile: Profile | null }) {
  return (
    <section className="bg-black/5 py-12">
      <div className="container mx-auto flex max-w-screen-md flex-col justify-between gap-10 px-4 sm:px-8 md:flex-row md:items-center">
        <div className="flex w-full flex-col justify-between gap-4 sm:flex-row sm:items-center sm:gap-10 md:flex-col md:items-start md:gap-4">
          <div className="flex w-full flex-col gap-2 text-center sm:text-left">
            <h1 className="font-bold font-serif text-4xl sm:text-5xl">
              Discover extraordinary
              <br className="block md:hidden" /> Montessori alumni
            </h1>
            <p className="text-sm text-stone-600 sm:max-w-100">
              Daily spotlight and a growing directory of Montessori alumni who've gone on to do
              great things. <strong>Open source</strong>.
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            <Button asChild className="shadow-none" size="lg">
              <Link href="/discover">
                <LayoutGridIcon className="h-4 w-4" />
                Get inspired
              </Link>
            </Button>

            <Button asChild className="border-black/10 shadow-none" size="lg" variant="outline">
              <Link
                href="https://github.com/renaissanceabc/the-montessorians"
                rel="noopener noreferrer"
                target="_blank"
              >
                <GitHubIcon className="h-4 w-4" />
                Contribute
              </Link>
            </Button>
          </div>
        </div>

        <FeaturedProfile dailyProfile={dailyProfile} />
      </div>
    </section>
  );
}
