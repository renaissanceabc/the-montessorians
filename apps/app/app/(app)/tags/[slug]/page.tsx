import { notFound } from "next/navigation";

import { getAllTags, getProfilesByTag, getTagBySlug } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";

import { TagProfilesPageWrapper } from "./components/tag-profiles-page-wrapper";

export const generateStaticParams = () => getAllTags().data.map((tag) => ({ slug: tag.slug }));

export const dynamicParams = false;

export const generateMetadata = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const tag = getTagBySlug(slug);

  if (!tag) {
    return {};
  }

  return createMetadata({
    alternates: {
      canonical: `${siteUrl}/tags/${tag.slug}`,
    },
    description: `Explore Montessorians tagged with "${tag.label}".`,
    image: `${siteUrl}/api/og/tags/${tag.slug}.png`,
    title: tag.label,
  });
};

const TagPage = async (props: { params: Promise<{ slug: string }> }) => {
  const { slug } = await props.params;
  const tag = getTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  const profiles = getProfilesByTag(slug);

  return <TagProfilesPageWrapper profiles={profiles} tag={tag} />;
};
export default TagPage;
