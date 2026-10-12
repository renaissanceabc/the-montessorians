import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { contributionUrl, identifierEntries, idUrl, personJsonLd } from "@/lib/content/authority";
import { getAllSlugs, getProfileWithAdjacent, getRelatedPeople } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { correctionUrl } from "@/lib/url";
import { siteUrl } from "@/lib/utils";
import ProfileActions from "./components/profile-actions";
import ProfileDetails from "./components/profile-details";
import { ProfileHeader } from "./components/profile-header";

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

  const contributions = profile.contributions.map((c) => {
    const href = contributionUrl(c);
    let host: string | null = null;
    try {
      host = href ? new URL(href).hostname.replace(/^www\./, "") : null;
    } catch {
      host = null;
    }
    return { ...c, href, host };
  });

  const permanentUrl = idUrl(profile.id);
  const jsonLd = personJsonLd(profile);

  return (
    <>
      <div className="container mx-auto flex max-w-3xl flex-col items-center gap-9 px-4 pt-8 pb-12 sm:px-8 lg:pt-0">
        <Breadcrumbs
          items={[
            { label: "Directory", href: "/discover" },
            isContributor
              ? { label: "Contributors", href: "/contributors" }
              : { label: "Alumni", href: "/alumni" },
            { label: profile.name },
          ]}
        />

        <ProfileHeader
          correctionUrl={correctionUrl(profile)}
          permanentUrl={permanentUrl}
          profile={profile}
        />

        <ProfileDetails
          contributions={contributions}
          correctionUrl={correctionUrl(profile)}
          identifiers={identifierEntries(profile.identifiers).map(({ label, value, url }) => ({
            label,
            value,
            url,
          }))}
          permanentId={{ value: profile.id, url: permanentUrl }}
          profile={profile}
          related={getRelatedPeople(profile)}
        />

        <Separator className="bg-black/10" />
        <ProfileActions next={next} previous={previous} />
      </div>

      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload, with `<` escaped to prevent breaking out of the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        type="application/ld+json"
      />
    </>
  );
}
