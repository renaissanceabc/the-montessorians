import { getEasternDate, getPastFeatures } from "@/lib/content/daily";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";
import { PastProfilesPageWrapper } from "./components/profiles-page-wrapper";

// Regenerate daily so the archive gains a new day's spotlight without a redeploy.
export const revalidate = 86_400;

export const generateMetadata = () => {
  return createMetadata({
    title: "Archive",
    description: "Archive of Montessorians.",
    alternates: {
      canonical: `${siteUrl}/archive`,
    },
  });
};

export default function Archive() {
  const profiles = getPastFeatures(getEasternDate(), 30);

  return <PastProfilesPageWrapper profiles={profiles} />;
}
