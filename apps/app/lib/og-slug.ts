const IMAGE_EXT_SUFFIX = /\.(?:png|jpe?g|webp|gif)$/iu;

/** Crawlers request `/api/og/{slug}.png`; the [slug] param includes the extension. */
export const normalizeOgSlug = (slug: string): string => slug.replace(IMAGE_EXT_SUFFIX, "");
