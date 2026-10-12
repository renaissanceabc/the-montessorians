import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

function hostnameFromUrl(url: string | undefined) {
  if (!url) {
    return;
  }
  try {
    return new URL(url).hostname;
  } catch {
    return;
  }
}

/**
 * The site's public origin: the Vercel production domain when set, then the
 * deployment URL (previews), then portless (montessorians.localhost), then
 * localhost. Permanent identifiers are built from it.
 */
export function resolveSiteUrl() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (host) {
    return `https://${host}`;
  }
  return (
    process.env.PORTLESS_URL?.replace(/\/$/, "") ?? `http://localhost:${process.env.PORT ?? 3000}`
  );
}

const devOrigins = [hostnameFromUrl(process.env.PORTLESS_URL)].filter((host): host is string =>
  Boolean(host)
);

export const config: NextConfig = {
  allowedDevOrigins: devOrigins,

  // Inlined for server and client code alike (read via `siteUrl` in the app).
  env: {
    SITE_URL: resolveSiteUrl(),
  },

  // biome-ignore lint/suspicious/useAwait: rewrites is async
  async rewrites() {
    return [
      // OG images
      {
        source: "/api/og/:slug.png",
        destination: "/api/og/:slug",
      },
      // PostHog
      {
        source: "/relay-r9etm/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/relay-r9etm/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/relay-r9etm/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  // Turbopack config (Next.js 16 uses Turbopack by default)
  turbopack: {},
};

export const withAnalyzer = (sourceConfig: NextConfig): NextConfig =>
  withBundleAnalyzer()(sourceConfig);
