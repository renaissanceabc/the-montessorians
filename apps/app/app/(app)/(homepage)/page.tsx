import { Container } from "@/components/container";
import { getDailyProfile, getEasternDate } from "@/lib/content/daily";
import { getAllProfiles, getProfiles } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";

import ContributeBand from "./components/contribute-band";
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
  const contributors = getProfiles({ kind: "contributor", limit: 6 });
  const peopleCount = getAllProfiles().length;
  const dailyProfile = getDailyProfile(getEasternDate());

  return (
    <Container className="flex flex-col gap-14 pt-8 pb-16 lg:gap-24 lg:pt-16 lg:pb-24">
      <Hero dailyProfile={dailyProfile} />

      <section aria-labelledby="home-recent" className="flex flex-col gap-6">
        <SectionHeader
          action={`Browse all ${peopleCount}`}
          href="/discover"
          id="home-recent"
          lead="The newest alumni in the directory."
          shortAction={`All ${peopleCount}`}
          title="Recently added"
        />
        <ProfilesHomepageList profiles={profiles} />
      </section>

      <ContributorsBand contributors={contributors} />

      <ContributeBand />
    </Container>
  );
};
export default Home;
