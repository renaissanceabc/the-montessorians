import { notFound } from "next/navigation";
import { getAllTags, getProfilesByTag, getTagBySlug } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";
import { TagProfilesPageWrapper } from "./components/tag-profiles-page-wrapper";

export function generateStaticParams() {
  return getAllTags().data.map((tag) => ({ slug: tag.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tag = getTagBySlug(slug);

  if (!tag) {
    return {};
  }

  return createMetadata({
    title: tag.label,
    description: `Explore Montessorians tagged with "${tag.label}".`,
    alternates: {
      canonical: `${siteUrl}/tags/${tag.slug}`,
    },
  });
}

export default async function TagPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const tag = getTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  const profiles = getProfilesByTag(slug);

  return <TagProfilesPageWrapper profiles={profiles} tag={tag} />;
}
