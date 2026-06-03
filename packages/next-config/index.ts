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

const devOrigins = [
  hostnameFromUrl(process.env.NEXT_PUBLIC_SITE_URL),
  hostnameFromUrl(process.env.PORTLESS_URL),
].filter((host): host is string => Boolean(host));

export const config: NextConfig = {
  allowedDevOrigins: devOrigins,

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
