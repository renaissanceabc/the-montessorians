import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProfileListItem from "@/components/profile-list-item";
import { Separator } from "@/components/ui/separator";
import { identifierEntries, idUrl, organizationJsonLd } from "@/lib/content/authority";
import {
  getAllOrganizations,
  getOrganizationBySlug,
  getOrganizationMembers,
  ORGANIZATION_TYPE_LABELS,
} from "@/lib/content/organizations";
import { createMetadata } from "@/lib/metadata";
import { prettyUrl, siteUrl } from "@/lib/utils";

export function generateStaticParams() {
  return getAllOrganizations().map((org) => ({ slug: org.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = getOrganizationBySlug(slug);
  if (!org) {
    notFound();
  }
  return createMetadata({
    title: org.name,
    description: org.description ?? `${org.name} on The Montessorians.`,
    alternates: {
      canonical: `${siteUrl}/organizations/${slug}`,
      types: { "application/ld+json": `${siteUrl}/data/${org.id}` },
    },
  });
}

export default async function OrganizationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = getOrganizationBySlug(slug);
  if (!org) {
    notFound();
  }

  const members = getOrganizationMembers(slug);
  const attended = members.filter((m) => m.relation === "attended");
  const affiliated = members.filter((m) => m.relation === "affiliated");
  const parent = org.parent ? getOrganizationBySlug(org.parent) : null;
  const identifiers = identifierEntries(org.identifiers);

  return (
    <>
      <div className="container mx-auto flex max-w-3xl flex-col items-center gap-10 px-4 pt-8 pb-12 sm:px-8 lg:pt-0">
        <Link
          className="flex flex-row items-center gap-2 text-muted-foreground text-sm hover:underline"
          href="/organizations"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Organizations
        </Link>

        <div className="flex flex-col items-center gap-3 text-center">
          <p className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
            {ORGANIZATION_TYPE_LABELS[org.type]}
          </p>
          <h1 className="font-semibold font-serif text-4xl">{org.name}</h1>
          {org.location && <p className="text-muted-foreground text-lg italic">{org.location}</p>}
        </div>

        {org.description && <p className="w-full text-base">{org.description}</p>}

        <dl className="grid w-full grid-cols-3 gap-x-10 gap-y-4 text-sm">
          {org.founded && (
            <>
              <dt className="font-semibold">Founded</dt>
              <dd className="col-span-2">{org.founded}</dd>
            </>
          )}
          {parent && (
            <>
              <dt className="font-semibold">Part of</dt>
              <dd className="col-span-2">
                <Link
                  className="underline hover:text-primary"
                  href={`/organizations/${parent.slug}`}
                >
                  {parent.name}
                </Link>
              </dd>
            </>
          )}
          {org.website && (
            <>
              <dt className="font-semibold">Website</dt>
              <dd className="col-span-2">
                <Link className="underline hover:text-primary" href={org.website} target="_blank">
                  {prettyUrl(org.website)}
                </Link>
              </dd>
            </>
          )}
          <dt className="font-semibold">Identifiers</dt>
          <dd className="col-span-2 flex flex-col gap-1">
            <span>
              <span className="text-muted-foreground">The Montessorians </span>
              <Link className="font-mono text-xs underline hover:text-primary" href={idUrl(org.id)}>
                {org.id}
              </Link>
            </span>
            {identifiers.map((identifier) => (
              <span key={identifier.scheme}>
                <span className="text-muted-foreground">{identifier.label} </span>
                <Link
                  className="font-mono text-xs underline hover:text-primary"
                  href={identifier.url}
                  target="_blank"
                >
                  {identifier.value}
                </Link>
              </span>
            ))}
          </dd>
        </dl>

        {affiliated.length > 0 && (
          <section className="flex w-full flex-col gap-2">
            <Separator className="mb-6 bg-black/10" />
            <h2 className="font-bold text-xl">Affiliated contributors</h2>
            {affiliated.map(({ profile }) => (
              <ProfileListItem key={profile.slug} profile={profile} />
            ))}
          </section>
        )}

        {attended.length > 0 && (
          <section className="flex w-full flex-col gap-2">
            <Separator className="mb-6 bg-black/10" />
            <h2 className="font-bold text-xl">Alumni</h2>
            {attended.map(({ profile }) => (
              <ProfileListItem key={profile.slug} profile={profile} />
            ))}
          </section>
        )}
      </div>

      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload, with `<` escaped to prevent breaking out of the script tag
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd(org)).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
    </>
  );
}
