import { Container } from "@/components/container";
import {
  getAllOrganizations,
  getOrganizationMembers,
  ORGANIZATION_TYPE_LABELS,
} from "@/lib/content/organizations";
import { getAllTags } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";

import { ContributeForm } from "./components/contribute-form";
import { SchemaReference } from "./components/schema-reference";

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
  <Container className="pt-6 pb-16 lg:pt-8" size="reading">
    <div className="mb-10 flex flex-col gap-2">
      <h1 className="type-title">Add a Montessorian</h1>
      <p className="type-lead max-w-lg">
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
      yamlReference={<SchemaReference />}
    />
  </Container>
);
export default Contribute;
