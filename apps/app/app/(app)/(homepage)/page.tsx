import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/container";
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

      <Container as="section" className="flex flex-col gap-5 py-12">
        <div className="flex flex-row items-end justify-between gap-4">
          <h2 className="type-section">Montessorians</h2>
          <Link
            className="flex shrink-0 flex-row items-center gap-1 text-sm font-semibold hover:underline"
            href="/alumni"
          >
            See all <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <ProfilesHomepageList profiles={profiles} />
      </Container>

      <ContributorsBand contributors={contributors} />

      <Contribute />
    </>
  );
};
export default Home;
