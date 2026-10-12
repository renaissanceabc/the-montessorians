import { getAffiliationOptions } from "@/lib/content/organizations";
import { getAllProfiles } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";
import { ProfilesPageWrapper } from "../discover/components/profiles-page-wrapper";

export const generateMetadata = () => {
  return createMetadata({
    title: "Contributors",
    description:
      "Trainers, teacher-scholars, researchers, authors, and philosophers with documented contributions to Montessori.",
    alternates: {
      canonical: `${siteUrl}/contributors`,
    },
  });
};

export default function Contributors() {
  return (
    <ProfilesPageWrapper
      affiliationOptions={getAffiliationOptions()}
      kind="contributor"
      profiles={getAllProfiles("contributor")}
      tags={[]}
    />
  );
}
