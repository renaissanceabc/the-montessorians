import { getDirectoryCounts } from "@/lib/content/directory";
import { getAllProfiles, getAllTags } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { DEFAULT_TAGS_FILTERS } from "@/lib/types";
import { siteUrl } from "@/lib/utils";

import { ProfilesPageWrapper } from "./components/profiles-page-wrapper";

export const generateMetadata = () =>
  createMetadata({
    alternates: {
      canonical: `${siteUrl}/discover`,
    },
    description:
      "Explore the directory of Montessorians: alumni who went on to do great things, and the people who shaped the field.",
    title: "Explore the Directory",
  });

const Discover = () => (
  // The full dataset is tiny — ship it once and filter/sort/search on the
  // client. Initial filter state is read from the URL inside the wrapper, so
  // this page stays fully static.
  <ProfilesPageWrapper
    counts={getDirectoryCounts()}
    profiles={getAllProfiles()}
    tags={getAllTags(DEFAULT_TAGS_FILTERS).data}
  />
);
export default Discover;
