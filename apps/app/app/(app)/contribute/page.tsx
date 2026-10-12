import {
  getAllOrganizations,
  getOrganizationMembers,
  ORGANIZATION_TYPE_LABELS,
} from "@/lib/content/organizations";
import { getAllTags } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";

import { ContributeForm } from "./components/contribute-form";

export const generateMetadata = () =>
  createMetadata({
    alternates: {
      canonical: `${siteUrl}/contribute`,
    },
    description:
      "Suggest a Montessori alum or someone who contributed to the field. No account needed.",
    title: "Add a Montessorian",
  });

const Contribute = () => (
  <div className="container mx-auto max-w-3xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
    <div className="mb-10 flex flex-col items-center gap-3 text-center">
      <h1 className="font-serif text-4xl font-bold lg:text-5xl">Add a Montessorian</h1>
      <p className="text-muted-foreground max-w-lg text-balance">
        Fill in what you know. No account needed. We review every submission before it&apos;s
        published.
      </p>
    </div>
    <ContributeForm
      organizations={getAllOrganizations().map((org) => ({
        meta: [ORGANIZATION_TYPE_LABELS[org.type], org.location].filter(Boolean).join(" · "),
        name: org.name,
        people: new Set(getOrganizationMembers(org.slug).map((m) => m.profile.slug)).size,
        shortName: org.shortName,
        slug: org.slug,
      }))}
      tagSuggestions={getAllTags().data}
    />
  </div>
);
export default Contribute;
