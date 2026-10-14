import { parseError } from "@montessorians/observability/error";
import { log } from "@montessorians/observability/log";

import {
  getAllOrganizations,
  getOrganizationBySlug,
  ORGANIZATION_TYPE_LABELS,
} from "@/lib/content/organizations";
import { imageFileToDataUrl, textCardResponse } from "@/lib/og";
import { normalizeOgSlug } from "@/lib/og-slug";

// Built for every organization, with `.png` variants like the profile images.
export const generateStaticParams = () =>
  getAllOrganizations().flatMap((org) => [{ slug: org.slug }, { slug: `${org.slug}.png` }]);

export const dynamic = "force-static";
export const dynamicParams = false;

/**
 * GET /api/og/organizations/[slug]
 *
 * The Open Graph image for an organization page: its name, type and place,
 * and its logo when the dataset has one.
 */
export const GET = async (_request: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug: rawSlug } = await params;
  const slug = normalizeOgSlug(rawSlug);
  const org = getOrganizationBySlug(slug);
  if (!org) {
    return new Response(null, { status: 404 });
  }
  const card = {
    eyebrow: ORGANIZATION_TYPE_LABELS[org.type],
    subtitle: org.location,
    title: org.shortName ? `${org.name} (${org.shortName})` : org.name,
  };
  try {
    const logoDataUrl = org.logoUrl ? await imageFileToDataUrl(org.logoUrl) : null;
    return await textCardResponse({ ...card, logoDataUrl });
  } catch (error) {
    // A logo Satori can't draw shouldn't cost the organization its card.
    log.error("OG image: organization logo failed", { error: parseError(error), slug });
    return textCardResponse(card);
  }
};
