import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import Contribute from "@/components/contribute";
import { getDailyProfile, getEasternDate } from "@/lib/content/daily";
import { getProfiles } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";

import ContributorsBand from "./components/contributors-band";
import Hero from "./components/hero";
import ProfilesHomepageList from "./components/profiles-list";

// Regenerate daily so the featured profile rotates without a redeploy.
export const revalidate = 86_400;

export const generateMetadata = () =>
  createMetadata({
    alternates: {
      canonical: `${siteUrl}/`,
    },
    description: "A collection of Montessorians, including educators, activists, and innovators.",
    title: "The Montessorians",
  });

const Home = () => {
  const profiles = getProfiles({ kind: "alum", limit: 10 });
  const contributors = getProfiles({ kind: "contributor", limit: 6 });
  const dailyProfile = getDailyProfile(getEasternDate());

  return (
    <>
      <Hero dailyProfile={dailyProfile} />
      <div className="container mx-auto flex max-w-screen-md flex-row items-center justify-between gap-10 px-4 py-8 sm:px-8">
        <div className="flex w-full max-w-screen-md flex-col items-center gap-4">
          <div className="flex w-full flex-row items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Montessorians</h2>
            <Link
              className="flex flex-row items-center gap-1 text-sm font-semibold hover:underline"
              href="/alumni"
            >
              See all <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <ProfilesHomepageList profiles={profiles} />
        </div>
      </div>

      <ContributorsBand contributors={contributors} />

      <Contribute />
    </>
  );
};
export default Home;
