import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const hostnameFromUrl = (url: string | undefined) => {
  if (!(url && URL.canParse(url))) {
    return;
  }
  return new URL(url).hostname;
};

/**
 * The site's public origin: the Vercel production domain when set, then the
 * deployment URL (previews), then portless (montessorians.localhost), then
 * localhost. Permanent identifiers are built from it.
 */
export const resolveSiteUrl = () => {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (host) {
    return `https://${host}`;
  }
  return (
    process.env.PORTLESS_URL?.replace(/\/$/u, "") ?? `http://localhost:${process.env.PORT ?? 3000}`
  );
};

// Dev only: the portless URL, plus Tailscale hostnames so `tailscale serve` works on a phone.
const devOrigins = [hostnameFromUrl(process.env.PORTLESS_URL), "**.ts.net"].filter(
  (host): host is string => Boolean(host)
);

const isDev = process.env.NODE_ENV === "development";
const isPreview = process.env.VERCEL_ENV === "preview";
const hasGoogleAnalytics = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

/** Vercel BotID serves its challenge scripts from this same-origin path (botid/next/config). */
const BOTID_PATH = "149e9513-01fa-4fb0-aad4-566afd725d1b";

const GOOGLE_ANALYTICS = {
  connect: [
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://*.googletagmanager.com",
  ],
  img: ["https://*.google-analytics.com", "https://*.googletagmanager.com"],
  script: ["https://*.googletagmanager.com"],
};

/** The Vercel toolbar (comments, feedback) on preview deployments. */
const VERCEL_TOOLBAR = {
  connect: ["https://vercel.live", "wss://ws-us3.pusher.com"],
  font: ["https://vercel.live", "https://assets.vercel.com"],
  frame: ["https://vercel.live"],
  img: ["https://vercel.live", "https://vercel.com"],
  script: ["https://vercel.live"],
  style: ["https://vercel.live"],
};

const sources = (...lists: (string[] | false)[]) => lists.flatMap((list) => list || []).join(" ");

/**
 * Everything the site loads comes from its own origin: PostHog through the
 * /relay-r9etm rewrite, Sentry through the /monitoring tunnel, Vercel
 * Analytics from /_vercel, BotID from its own rewrite, and fonts self-hosted
 * by next/font.
 *
 * - `'unsafe-inline'` scripts: statically rendered pages carry Next's inline
 *   bootstrap scripts and can't use per-request nonces without becoming dynamic.
 * - `'unsafe-eval'`: BotID's deep-analysis SDK (Kasada) may evaluate code; it only
 *   runs on Vercel, so drop this once a preview shows no violation without it.
 *   Next's dev server needs it too.
 * - `'unsafe-inline'` styles: Next, Sonner, and Base UI set inline styles.
 * - `blob:` workers: Sentry Replay and PostHog compress recordings in a worker.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${sources(
    ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'wasm-unsafe-eval'"],
    isDev && ["https://va.vercel-scripts.com"],
    hasGoogleAnalytics && GOOGLE_ANALYTICS.script,
    isPreview && VERCEL_TOOLBAR.script
  )}`,
  `style-src ${sources(["'self'", "'unsafe-inline'"], isPreview && VERCEL_TOOLBAR.style)}`,
  `img-src ${sources(
    ["'self'", "data:", "blob:"],
    hasGoogleAnalytics && GOOGLE_ANALYTICS.img,
    isPreview && VERCEL_TOOLBAR.img
  )}`,
  `font-src ${sources(["'self'", "data:"], isPreview && VERCEL_TOOLBAR.font)}`,
  `connect-src ${sources(
    ["'self'"],
    isDev && ["ws:", "https://va.vercel-scripts.com"],
    hasGoogleAnalytics && GOOGLE_ANALYTICS.connect,
    isPreview && VERCEL_TOOLBAR.connect
  )}`,
  `frame-src ${sources(["'self'"], isPreview && VERCEL_TOOLBAR.frame)}`,
  "worker-src 'self' blob:",
  "media-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
];

export const config: NextConfig = {
  allowedDevOrigins: devOrigins,

  // Inlined for server and client code alike (read via `siteUrl` in the app).
  env: {
    SITE_URL: resolveSiteUrl(),
  },

  headers: () =>
    Promise.resolve([
      {
        headers: securityHeaders,
        // Everything except BotID's challenge path, which sets its own framing
        // headers (it must be frameable by this origin).
        source: `/:path((?!${BOTID_PATH}/).*)`,
      },
      {
        // Organization logos are third-party SVGs: never let one run anything,
        // even when opened directly. Overrides the page policy above.
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; style-src 'unsafe-inline'; sandbox",
          },
        ],
        source: "/logos/:path*",
      },
    ]),

  rewrites: () =>
    Promise.resolve([
      // OG images
      {
        destination: "/api/og/:slug",
        source: "/api/og/:slug.png",
      },
      // PostHog
      {
        destination: "https://us-assets.i.posthog.com/static/:path*",
        source: "/relay-r9etm/static/:path*",
      },
      {
        destination: "https://us.i.posthog.com/:path*",
        source: "/relay-r9etm/:path*",
      },
      {
        destination: "https://us.i.posthog.com/decide",
        source: "/relay-r9etm/decide",
      },
    ]),

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  // Turbopack config (Next.js 16 uses Turbopack by default)
  turbopack: {},
};

export const withAnalyzer = (sourceConfig: NextConfig): NextConfig =>
  withBundleAnalyzer()(sourceConfig);
