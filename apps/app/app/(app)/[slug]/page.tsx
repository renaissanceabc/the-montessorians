import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { getAllSlugs, getProfileWithAdjacent } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";
import ProfileActions from "./components/profile-actions";
import ProfileDetails from "./components/profile-details";

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    description: profile.tagline || profile.bio,
    url: `${siteUrl}/${profile.slug}`,
    image: `${siteUrl}/api/og/${profile.slug}.png`,
    sameAs: profile.links?.map((link) => link.url),
  };

  return (
    <>
      <div className="container mx-auto flex max-w-3xl flex-row items-center justify-between gap-10 px-4 pt-8 pb-12 sm:px-8 lg:pt-0">
        <div className="grid w-full items-center justify-items-center gap-10">
          <Link
            className="flex flex-row items-center gap-2 text-muted-foreground text-sm hover:underline"
            href="/discover"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Montessorians
          </Link>

          <ProfileDetails profile={profile} />

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
