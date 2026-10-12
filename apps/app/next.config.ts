import { config, withAnalyzer } from "@repo/next-config";
import { sentryEnabled, withLogging, withSentry } from "@repo/observability/next-config";
import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

import { env } from "@/env";

import authorityRedirects from "./lib/content/redirects.generated.json";

// A copy: the shared base config must not be mutated (its redirects are wrapped below).
let nextConfig: NextConfig = { ...withLogging(config) };
const baseRedirects = config.redirects;

// Permanent ids (/id/<id>) and old slugs from renames and merges
// (data/authority/changes.yaml) redirect to the current page.
nextConfig.redirects = async () => [
  ...((await baseRedirects?.()) ?? []),
  ...authorityRedirects.map((r: { source: string; destination: string }) => ({
    ...r,
    permanent: true,
  })),
];

if (sentryEnabled) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default withBotId(nextConfig);
