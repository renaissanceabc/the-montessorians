import { getDirectoryCounts } from "@/lib/content/directory";
import { getAffiliationOptions } from "@/lib/content/organizations";
import { getAllProfiles } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";

import { ProfilesPageWrapper } from "../discover/components/profiles-page-wrapper";

export const generateMetadata = () =>
  createMetadata({
    alternates: {
      canonical: `${siteUrl}/contributors`,
    },
    description:
      "Trainers, practitioner-scholars, researchers, authors, and philosophers with documented contributions to Montessori.",
    title: "Contributors",
  });

const Contributors = () => (
  <ProfilesPageWrapper
    affiliationOptions={getAffiliationOptions()}
    counts={getDirectoryCounts()}
    kind="contributor"
    profiles={getAllProfiles("contributor")}
    tags={[]}
  />
);
export default Contributors;
