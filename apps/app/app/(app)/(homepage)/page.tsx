import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import Contribute from "@/components/contribute";
import { getDailyProfile, getEasternDate } from "@/lib/content/daily";
import { getProfiles } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";
import Hero from "./components/hero";
import ProfilesHomepageList from "./components/profiles-list";

// Regenerate daily so the featured profile rotates without a redeploy.
export const revalidate = 86_400;

export const generateMetadata = () => {
  return createMetadata({
    title: "The Montessorians",
    description: "A collection of Montessorians, including educators, activists, and innovators.",
    alternates: {
      canonical: `${siteUrl}/`,
    },
  });
};

export default function Home() {
  const profiles = getProfiles({ limit: 10 });
  const dailyProfile = getDailyProfile(getEasternDate());

  return (
    <>
      <Hero dailyProfile={dailyProfile} />
      <div className="container mx-auto flex max-w-screen-md flex-row items-center justify-between gap-10 px-4 py-8 sm:px-8">
        <div className="flex w-full max-w-screen-md flex-col items-center gap-4">
          <div className="flex w-full flex-row items-center justify-between gap-4">
            <h2 className="font-bold text-xl">Montessorians</h2>
            <Link
              className="flex flex-row items-center gap-1 font-semibold text-sm hover:underline"
              href="/discover"
            >
              See all <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <ProfilesHomepageList profiles={profiles} />
        </div>
      </div>

      <Contribute />
    </>
  );
}
