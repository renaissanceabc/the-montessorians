import { getDirectoryCounts } from "@/lib/content/directory";
import {
  getAllOrganizations,
  getOrganizationMembers,
  ORGANIZATION_TYPE_LABELS,
} from "@/lib/content/organizations";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";

import { OrganizationsDirectory } from "./components/organizations-directory";

export const generateMetadata = () =>
  createMetadata({
    alternates: {
      canonical: `${siteUrl}/organizations`,
    },
    description:
      "Montessori schools, training centers, universities, and associations connected to The Montessorians.",
    title: "Organizations",
  });

const Organizations = () => {
  const organizations = getAllOrganizations().map((org) => ({
    location: org.location,
    logoUrl: org.logoUrl ?? null,
    name: org.name,
    nameVariants: org.nameVariants ?? [],
    people: new Set(getOrganizationMembers(org.slug).map((m) => m.profile.slug)).size,
    shortName: org.shortName,
    slug: org.slug,
    type: org.type,
    typeLabel: ORGANIZATION_TYPE_LABELS[org.type],
  }));

  return <OrganizationsDirectory counts={getDirectoryCounts()} organizations={organizations} />;
};
export default Organizations;
