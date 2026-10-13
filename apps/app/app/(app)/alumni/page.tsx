import { getDirectoryCounts } from "@/lib/content/directory";
import { getAllProfiles, getAllTags } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { DEFAULT_TAGS_FILTERS } from "@/lib/types";
import { siteUrl } from "@/lib/utils";

import { ProfilesPageWrapper } from "../discover/components/profiles-page-wrapper";

export const generateMetadata = () =>
  createMetadata({
    alternates: {
      canonical: `${siteUrl}/alumni`,
    },
    description: "Montessori alumni who went on to do great things.",
    title: "Alumni",
  });

const Alumni = () => (
  <ProfilesPageWrapper
    counts={getDirectoryCounts()}
    kind="alum"
    profiles={getAllProfiles("alum")}
    tags={getAllTags(DEFAULT_TAGS_FILTERS, "alum").data}
  />
);
export default Alumni;
