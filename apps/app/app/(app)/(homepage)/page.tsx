import { ArrowRightIcon } from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import Contribute from "@/components/contribute";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";
import { getQueryClient, trpc } from "@/trpc/server";
import Hero from "./components/hero";
import ProfilesHomepageList from "./components/profiles-list";

export const generateMetadata = () => {
  return createMetadata({
    title: "The Montessorians",
    description: "A collection of Montessorians, including educators, activists, and innovators.",
    alternates: {
      canonical: `${siteUrl}/`,
    },
  });
};

export default async function Home() {
  "use cache";
  cacheTag("profiles", "daily-profile");
  cacheLife("days");

  const qc = getQueryClient();
  const [profiles, dailyProfile] = await Promise.all([
    qc.fetchQuery(trpc.profiles.list.queryOptions()),
    qc.fetchQuery(trpc.profiles.daily.queryOptions()),
  ]);

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

          <ProfilesHomepageList profiles={profiles.data} />
        </div>
      </div>

      <Contribute />
    </>
  );
}
