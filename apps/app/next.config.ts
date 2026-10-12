import { config, withAnalyzer } from "@repo/next-config";
import { withLogging, withSentry } from "@repo/observability/next-config";
import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";
import { env } from "@/env";
import authorityRedirects from "./lib/content/redirects.generated.json";

let nextConfig: NextConfig = withLogging(config);

// Permanent ids (/id/<id>) and old slugs from renames and merges
// (data/authority/changes.yaml) redirect to the current page.
nextConfig.redirects = async () => [
  ...((await config.redirects?.()) ?? []),
  ...authorityRedirects.map((r: { source: string; destination: string }) => ({
    ...r,
    permanent: true,
  })),
];

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default withBotId(nextConfig);
