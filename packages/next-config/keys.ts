import { vercel } from "@t3-oss/env-core/presets-zod";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const getPreviewUrl = (vercelUrl?: string) => {
  if (!vercelUrl) {
    return;
  }

  return `https://${vercelUrl}`;
};

export const keys = () => {
  // Get preview URLs if we're in a preview deployment
  const _previewUrl =
    process.env.VERCEL_ENV === "preview" ? getPreviewUrl(process.env.VERCEL_URL) : undefined;

  return createEnv({
    extends: [vercel()],
    server: {
      ANALYZE: z.string().optional(),
      BLOB_PUBLIC_BASE_URL: z.string(),
      BLOB_READ_WRITE_TOKEN: z.string(),
      API_SECRET: z.string(),
      GITHUB_TOKEN: z.string().min(1),
      GITHUB_DATA_URL: z.string().min(1).url(),
      VERCEL_URL: z.string().optional(),
      VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
      // Added by Vercel
      NEXT_RUNTIME: z.enum(["nodejs", "edge"]).optional(),
    },
    client: {
      NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1).url(),
      NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
      NEXT_PUBLIC_SENTRY_DSN: z.string().min(1).url(),
    },
    runtimeEnv: {
      ANALYZE: process.env.ANALYZE,
      BLOB_PUBLIC_BASE_URL: process.env.BLOB_PUBLIC_BASE_URL,
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
      API_SECRET: process.env.API_SECRET,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      GITHUB_DATA_URL: process.env.GITHUB_DATA_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV as "production" | "preview" | "development" | undefined,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME,
      // Use preview URLs if available, otherwise fall back to configured env vars
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    },
  });
};
