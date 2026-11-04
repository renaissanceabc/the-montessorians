import { config, withAnalyzer } from "@montessorians/next-config";
import { sentryEnabled, withLogging, withSentry } from "@montessorians/observability/next-config";
import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

import { env } from "@/env";

import authorityHeaders from "./lib/content/headers.generated.json";
import authorityRedirects from "./lib/content/redirects.generated.json";

// A copy: the shared base config must not be mutated (its redirects are wrapped below).
let nextConfig: NextConfig = { ...withLogging(config) };
const baseRedirects = config.redirects;
const baseHeaders = config.headers;

/** Permanent ids: tm + 7 digits for people, tmo + 6 for organizations. */
const ID_PATTERN = String.raw`tm\d{7}|tmo\d{6}`;

// Permanent ids (/id/<id>) and old slugs from renames and merges
// (data/authority/changes.yaml) redirect to the current page.
nextConfig.redirects = async () => [
  ...((await baseRedirects?.()) ?? []),
  // Linked-data clients asking for JSON-LD get the record's data, not its page
  // (303 See Other: the URI names the person, /data/<id> describes them).
  // Listed before the page redirects so it wins.
  {
    destination: "/data/:id",
    has: [{ key: "accept", type: "header", value: String.raw`.*application/(ld\+)?json.*` }],
    source: `/id/:id(${ID_PATTERN})`,
    statusCode: 303,
  },
  ...authorityRedirects.map((r: { source: string; destination: string }) => ({
    ...r,
    permanent: true,
  })),
];

nextConfig.headers = async () => [
  ...((await baseHeaders?.()) ?? []),
  // /id/<id> answers differently by Accept header, so caches must key on it.
  { headers: [{ key: "Vary", value: "Accept" }], source: `/id/:id(${ID_PATTERN})` },
  ...authorityHeaders,
];

if (sentryEnabled) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default withBotId(nextConfig);
