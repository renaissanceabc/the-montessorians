import { getDirectoryCounts } from "@/lib/content/directory";
import {
  getAllOrganizations,
  getOrganizationMembers,
  ORGANIZATION_TYPE_LABELS,
} from "@/lib/content/organizations";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";
import { OrganizationsDirectory } from "./components/organizations-directory";

export const generateMetadata = () => {
  return createMetadata({
    title: "Organizations",
    description:
      "Montessori schools, training centers, universities, and associations connected to The Montessorians.",
    alternates: {
      canonical: `${siteUrl}/organizations`,
    },
  });
};

export default function Organizations() {
  const organizations = getAllOrganizations().map((org) => ({
    slug: org.slug,
    name: org.name,
    shortName: org.shortName,
    nameVariants: org.nameVariants ?? [],
    type: org.type,
    typeLabel: ORGANIZATION_TYPE_LABELS[org.type],
    location: org.location,
    logoUrl: org.logoUrl ?? null,
    people: new Set(getOrganizationMembers(org.slug).map((m) => m.profile.slug)).size,
  }));

  return <OrganizationsDirectory counts={getDirectoryCounts()} organizations={organizations} />;
}
