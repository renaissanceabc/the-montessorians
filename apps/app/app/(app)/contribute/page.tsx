import {
  getAllOrganizations,
  getOrganizationMembers,
  ORGANIZATION_TYPE_LABELS,
} from "@/lib/content/organizations";
import { getAllTags } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";
import { ContributeForm } from "./components/contribute-form";

export const generateMetadata = () => {
  return createMetadata({
    title: "Add a Montessorian",
    description:
      "Suggest a Montessori alum or someone who contributed to the field. No account needed.",
    alternates: {
      canonical: `${siteUrl}/contribute`,
    },
  });
};

export default function Contribute() {
  return (
    <div className="container mx-auto max-w-3xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <h1 className="font-bold font-serif text-4xl lg:text-5xl">Add a Montessorian</h1>
        <p className="max-w-lg text-balance text-muted-foreground">
          Fill in what you know. No account needed. We review every submission before it's
          published.
        </p>
      </div>
      <ContributeForm
        organizations={getAllOrganizations().map((org) => ({
          slug: org.slug,
          name: org.name,
          shortName: org.shortName,
          meta: [ORGANIZATION_TYPE_LABELS[org.type], org.location].filter(Boolean).join(" · "),
          people: new Set(getOrganizationMembers(org.slug).map((m) => m.profile.slug)).size,
        }))}
        tagSuggestions={getAllTags().data}
      />
    </div>
  );
}
