// app/api/og/[slug]/route.tsx

import { parseError } from "@montessorians/observability/error";
import { log } from "@montessorians/observability/log";
import { ImageResponse } from "next/og";

import { getAllSlugs, getProfileBySlug } from "@/lib/content/profiles";
import { imageFileToDataUrl, OG_CACHE_CONTROL, OG_SIZE, textCardResponse } from "@/lib/og";
import { instrumentSerif } from "@/lib/og-font";
import { normalizeOgSlug } from "@/lib/og-slug";

// Pre-render every profile's OG image at build time (no runtime function).
// Include `.png` variants — metadata/sitemap use `/api/og/{slug}.png`, and the
// [slug] route matches that before the `/api/og/:slug.png` rewrite can run.
export const generateStaticParams = () =>
  getAllSlugs().flatMap((slug) => [{ slug }, { slug: `${slug}.png` }]);

export const dynamic = "force-static";
export const dynamicParams = false;

// Helper function to split name into first and last name
const splitName = (name: string): [string, string] => {
  const parts = name.trim().split(/\s+/u);
  if (parts.length === 1) {
    return [parts[0], ""];
  }
  // First name is everything except the last part
  const firstName = parts.slice(0, -1).join(" ");
  const lastName = parts.at(-1) ?? "";
  return [firstName, lastName];
};

// Calculate font size based on line length
const getFontSize = (lineLength: number, baseSize: number): number => {
  if (lineLength > 12) {
    // Scale down proportionally for long names
    const ratio = 12 / lineLength;
    return Math.floor(baseSize * ratio);
  }
  return baseSize;
};
const generateProfileImageResponse = (params: {
  profile: { name: string; imageUrl: string };
  backgroundImageUrl: string;
  profileImageUrl: string;
  slug: string;
}): ImageResponse => {
  const { profile, backgroundImageUrl, profileImageUrl, slug } = params;

  const [firstName, lastName] = splitName(profile.name);
  const firstNameSize = getFontSize(firstName.length, 104);
  const lastNameSize = getFontSize(lastName.length, 104);

  try {
    const response = new ImageResponse(
      <div
        style={{
          alignItems: "center",
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundPosition: "left",
          backgroundSize: "cover",
          display: "flex",
          flexDirection: "column",
          height: "630px",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          width: "1200px",
        }}
      >
        {/* oxlint-disable-next-line next/no-img-element -- ImageResponse (Satori) renders plain <img>; next/image can't run inside it. */}
        <img
          alt={profile.name}
          height={470}
          src={profileImageUrl}
          style={{
            borderRadius: "50%",
            height: "470px",
            objectFit: "cover",
            position: "absolute",
            right: "80px",
            top: "80px",
            width: "470px",
          }}
          width={470}
        />

        <div
          style={{
            alignItems: "flex-start",
            bottom: "80px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            left: "60px",
            position: "absolute",
            right: "80px",
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: `${firstNameSize}px`,
              fontWeight: "600",
              lineHeight: "0.9",
              marginBottom: lastName ? "8px" : "0",
              textShadow: "0 0 10px rgba(0,0,0,0.5)",
            }}
          >
            {firstName}
          </div>
          {lastName && (
            <div
              style={{
                color: "white",
                fontSize: `${lastNameSize}px`,
                fontWeight: "600",
                lineHeight: "0.9",
                textShadow: "0 0 10px rgba(0,0,0,0.5)",
              }}
            >
              {lastName}
            </div>
          )}
        </div>
      </div>,
      {
        fonts: [instrumentSerif],
        ...OG_SIZE,
      }
    );

    // Add cache headers for better crawler performance (1 year cache)
    response.headers.set("Cache-Control", OG_CACHE_CONTROL);
    response.headers.set("Content-Type", "image/png");

    return response;
  } catch (imageError) {
    log.error("OG image: Failed to create ImageResponse with font", {
      error: parseError(imageError),
      slug,
    });

    // Retry without font as fallback
    const firstNameSizeNoFont = getFontSize(firstName.length, 104);
    const lastNameSizeNoFont = getFontSize(lastName.length, 104);

    const response = new ImageResponse(
      <div
        style={{
          alignItems: "center",
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundPosition: "left",
          backgroundSize: "cover",
          display: "flex",
          flexDirection: "column",
          height: "630px",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          width: "1200px",
        }}
      >
        {/* oxlint-disable-next-line next/no-img-element -- ImageResponse (Satori) renders plain <img>; next/image can't run inside it. */}
        <img
          alt={profile.name}
          height={470}
          src={profileImageUrl}
          style={{
            borderRadius: "100%",
            height: "470px",
            objectFit: "cover",
            position: "absolute",
            right: "80px",
            top: "80px",
            width: "470px",
          }}
          width={470}
        />

        <div
          style={{
            alignItems: "flex-start",
            bottom: "80px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            left: "80px",
            position: "absolute",
            right: "80px",
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: `${firstNameSizeNoFont}px`,
              fontWeight: "600",
              lineHeight: "0.9",
              marginBottom: lastName ? "8px" : "0",
              textShadow: "0 0 10px rgba(0,0,0,0.5)",
            }}
          >
            {firstName}
          </div>
          {lastName && (
            <div
              style={{
                color: "white",
                fontSize: `${lastNameSizeNoFont}px`,
                fontWeight: "600",
                lineHeight: "0.9",
                textShadow: "0 0 10px rgba(0,0,0,0.5)",
              }}
            >
              {lastName}
            </div>
          )}
        </div>
      </div>,
      {
        ...OG_SIZE,
      }
    );

    // Add cache headers
    response.headers.set("Cache-Control", OG_CACHE_CONTROL);
    response.headers.set("Content-Type", "image/png");

    return response;
  }
};

// Generate fallback response
const generateFallbackResponse = async (slug?: string): Promise<Response> => {
  const backgroundImageUrl = await imageFileToDataUrl("og.png");

  try {
    const response = new ImageResponse(
      <div
        style={{
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          height: "630px",
          width: "1200px",
        }}
      />,
      {
        ...OG_SIZE,
      }
    );

    // Add cache headers for fallback image
    response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
    response.headers.set("Content-Type", "image/png");

    return response;
  } catch (fallbackError) {
    log.error("OG image: Failed to create fallback ImageResponse", {
      error: parseError(fallbackError),
      slug,
    });

    // Last resort: return a simple text response
    return new Response("Failed to generate image", {
      headers: {
        "Content-Type": "text/plain",
      },
      status: 500,
    });
  }
};

/**
 * GET /api/og/[slug]
 *
 * Generate an Open Graph image for a profile (statically, at build)
 */
export const GET = async (_request: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug: rawSlug } = await params;
  const slug = normalizeOgSlug(rawSlug);

  try {
    const profile = getProfileBySlug(slug);
    if (!profile) {
      return new Response(null, { status: 404 });
    }
    if (!profile.imageUrl) {
      // No photo: a text card with the name and tagline, not the generic site image.
      return await textCardResponse({
        eyebrow: profile.kind === "contributor" ? "Montessori contributor" : "Montessori alum",
        subtitle: profile.tagline,
        title: profile.name,
      });
    }

    const [backgroundImageUrl, profileImageUrl] = await Promise.all([
      imageFileToDataUrl("og-dynamic.jpg"),
      imageFileToDataUrl(profile.imageUrl.replace(/^\//u, "")),
    ]);

    return generateProfileImageResponse({
      backgroundImageUrl,
      profile: { imageUrl: profile.imageUrl, name: profile.name },
      profileImageUrl,
      slug,
    });
  } catch (error) {
    log.error("OG image: Error generating image", {
      error: parseError(error),
      slug,
    });

    // Fallback to simple background image
    return generateFallbackResponse(slug);
  }
};
