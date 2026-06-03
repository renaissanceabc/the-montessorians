import { getAllProfiles, getAllTags } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { DEFAULT_TAGS_FILTERS } from "@/lib/types";
import { siteUrl } from "@/lib/utils";
import { ProfilesPageWrapper } from "./components/profiles-page-wrapper";

export const generateMetadata = () => {
  return createMetadata({
    title: "Explore the Directory",
    description:
      "Explore the directory of Montessorians, including educators, activists, and innovators.",
    alternates: {
      canonical: `${siteUrl}/discover`,
    },
  });
};

export default function Profiles() {
  // The full dataset is tiny — ship it once and filter/sort/search on the
  // client. Initial filter state is read from the URL inside the wrapper, so
  // this page stays fully static.
  const profiles = getAllProfiles();
  const tagsList = getAllTags(DEFAULT_TAGS_FILTERS).data;

  return <ProfilesPageWrapper profiles={profiles} tags={tagsList} />;
}
