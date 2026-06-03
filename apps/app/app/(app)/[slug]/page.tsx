import { ArrowLeftIcon } from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";
import { getQueryClient, trpc } from "@/trpc/server";
import ProfileActions from "./components/profile-actions";
import ProfileDetails from "./components/profile-details";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  "use cache";
  cacheTag("profiles");
  cacheLife("days");

  const { slug } = await params;
  const data = await getQueryClient().fetchQuery(trpc.profiles.bySlug.queryOptions({ slug }));

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
  "use cache";
  cacheTag("profiles");
  cacheLife("days");

  const { slug } = await props.params;
  const data = await getQueryClient().fetchQuery(trpc.profiles.bySlug.queryOptions({ slug }));

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
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is sanitized
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
    </>
  );
}
