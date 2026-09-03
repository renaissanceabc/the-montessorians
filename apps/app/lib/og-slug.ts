const IMAGE_EXT_SUFFIX = /\.(png|jpe?g|webp|gif)$/i;

/** Crawlers request `/api/og/{slug}.png`; the [slug] param includes the extension. */
export function normalizeOgSlug(slug: string): string {
  return slug.replace(IMAGE_EXT_SUFFIX, "");
}
