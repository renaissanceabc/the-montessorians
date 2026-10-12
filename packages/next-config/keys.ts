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
    client: {
      // Required on Vercel, optional locally (see @montessorians/analytics/keys).
      NEXT_PUBLIC_POSTHOG_HOST: process.env.VERCEL
        ? z.string().min(1).url()
        : z.string().min(1).url().optional(),
      NEXT_PUBLIC_POSTHOG_KEY: process.env.VERCEL
        ? z.string().min(1)
        : z.string().min(1).optional(),
      NEXT_PUBLIC_SENTRY_DSN: z.string().min(1).url().optional(),
    },
    extends: [vercel()],
    runtimeEnv: {
      ANALYZE: process.env.ANALYZE,
      // Use preview URLs if available, otherwise fall back to configured env vars
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    },
    server: {
      ANALYZE: z.string().optional(),
      // Added by Vercel
      NEXT_RUNTIME: z.enum(["nodejs", "edge"]).optional(),
      VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
      VERCEL_URL: z.string().optional(),
    },
  });
};
