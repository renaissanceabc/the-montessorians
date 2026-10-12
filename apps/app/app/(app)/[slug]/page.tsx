import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { contributionUrl, identifierEntries, idUrl, personJsonLd } from "@/lib/content/authority";
import { getOrganizationBySlug } from "@/lib/content/organizations";
import { getAllSlugs, getProfileWithAdjacent } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { correctionUrl } from "@/lib/url";
import { siteUrl, toTitleCase } from "@/lib/utils";
import ProfileActions from "./components/profile-actions";
import ProfileDetails, { type OrganizationLabel } from "./components/profile-details";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = getProfileWithAdjacent(slug);

  if (!data) {
    notFound();
  }

  return createMetadata({
    title: data.profile.name,
    description: data.profile.tagline || "",
    image: `${siteUrl}/api/og/${slug}.png`,
    alternates: {
      canonical: `${siteUrl}/${slug}`,
      types: {
        "application/ld+json": `${siteUrl}/data/${data.profile.id}`,
      },
    },
    other: {
      // The permanent identifier, for citation managers and crawlers.
      "dc.identifier": idUrl(data.profile.id),
    },
  });
}

export default async function ProfilePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const data = getProfileWithAdjacent(slug);

  if (!data) {
    notFound();
  }

  const { profile, previous, next } = data;
  const isContributor = profile.kind === "contributor";

  const organizations: Record<string, OrganizationLabel> = {};
  for (const ref of [...profile.schools, ...profile.affiliations]) {
    const org = getOrganizationBySlug(ref.organization);
    if (org) {
      organizations[org.slug] = { slug: org.slug, name: org.name };
    }
  }

  const contributions = profile.contributions.map((c) => ({
    title: c.title,
    meta: [c.venue ?? (c.type === "book" ? "Book" : toTitleCase(c.type)), c.year]
      .filter(Boolean)
      .join(", "),
    url: contributionUrl(c),
  }));

  const jsonLd = personJsonLd(profile);

  return (
    <>
      <div className="container mx-auto flex max-w-3xl flex-row items-center justify-between gap-10 px-4 pt-8 pb-12 sm:px-8 lg:pt-0">
        <div className="grid w-full items-center justify-items-center gap-10">
          <Link
            className="flex flex-row items-center gap-2 text-muted-foreground text-sm hover:underline"
            href={isContributor ? "/contributors" : "/discover"}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {isContributor ? "Back to Contributors" : "Back to Montessorians"}
          </Link>

          <ProfileDetails
            contributions={contributions}
            correctionUrl={correctionUrl(profile)}
            identifiers={identifierEntries(profile.identifiers).map(({ label, value, url }) => ({
              label,
              value,
              url,
            }))}
            organizations={organizations}
            permanentUrl={idUrl(profile.id)}
            profile={profile}
          />

          <Separator className="bg-black/10" />
          <ProfileActions next={next} previous={previous} />
        </div>
      </div>

      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload, with `<` escaped to prevent breaking out of the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        type="application/ld+json"
      />
    </>
  );
}
