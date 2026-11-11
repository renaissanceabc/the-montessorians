/**
 * Analytics env, read as literal `process.env.X` so Next inlines them in
 * client bundles. Varlock validates every value against apps/app/.env.schema
 * during the build: PostHog is required on Vercel (production and previews)
 * and optional locally, where analytics are simply skipped without a key.
 */
export const keys = () => ({
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
});
