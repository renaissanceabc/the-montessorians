import { Container } from "@/components/container";
import Contribute from "@/components/contribute";
import { getDailyProfile, getEasternDate } from "@/lib/content/daily";
import { getAllProfiles, getProfiles } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";

import ContributorsBand from "./components/contributors-band";
import Hero from "./components/hero";
import ProfilesHomepageList from "./components/profiles-list";
import SectionHeader from "./components/section-header";

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
  const profiles = getProfiles({ kind: "alum", limit: 6 });
  const peopleCount = getAllProfiles().length;
  const contributors = getProfiles({ kind: "contributor", limit: 6 });
  const dailyProfile = getDailyProfile(getEasternDate());

  return (
    <>
      <Container className="pt-8 lg:pt-16">
        <Hero dailyProfile={dailyProfile} />
      </Container>

      <Container
        aria-labelledby="home-recent"
        as="section"
        className="flex flex-col gap-6 py-14 lg:py-24"
      >
        <SectionHeader
          action={`Browse all ${peopleCount}`}
          href="/discover"
          id="home-recent"
          lead="The newest people in the directory."
          shortAction={`All ${peopleCount}`}
          title="Recently added"
        />
        <ProfilesHomepageList profiles={profiles} />
      </Container>

      <Container className="pb-14 lg:pb-24">
        <ContributorsBand contributors={contributors} />
      </Container>

      <Contribute />
    </>
  );
};
export default Home;
