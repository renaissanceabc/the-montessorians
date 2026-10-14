import { getAllTags, getProfilesByTag, getTagBySlug } from "@/lib/content/profiles";
import { textCardResponse } from "@/lib/og";
import { normalizeOgSlug } from "@/lib/og-slug";

// Built for every tag, with `.png` variants like the profile images.
export const generateStaticParams = () =>
  getAllTags().data.flatMap((tag) => [{ slug: tag.slug }, { slug: `${tag.slug}.png` }]);

export const dynamic = "force-static";
export const dynamicParams = false;

/**
 * GET /api/og/tags/[slug]
 *
 * The Open Graph image for a tag page: the tag and how many people carry it.
 */
export const GET = async (_request: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug: rawSlug } = await params;
  const slug = normalizeOgSlug(rawSlug);
  const tag = getTagBySlug(slug);
  if (!tag) {
    return new Response(null, { status: 404 });
  }
  const count = getProfilesByTag(slug).length;
  return textCardResponse({
    eyebrow: "Tag",
    subtitle: `${count} ${count === 1 ? "Montessorian" : "Montessorians"}`,
    title: tag.label,
  });
};
