import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// PostHog is required on Vercel (production and previews) and optional locally,
// where analytics are simply skipped without a key.
const onVercel = Boolean(process.env.VERCEL);
const posthogKey = z.string().min(1).startsWith("phc_");
const posthogHost = z.string().min(1).url();

export const keys = () =>
  createEnv({
    client: {
      NEXT_PUBLIC_POSTHOG_KEY: onVercel ? posthogKey : posthogKey.optional(),
      NEXT_PUBLIC_POSTHOG_HOST: onVercel ? posthogHost : posthogHost.optional(),
      NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().min(1).startsWith("G-").optional(),
    },
    runtimeEnv: {
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    },
  });
