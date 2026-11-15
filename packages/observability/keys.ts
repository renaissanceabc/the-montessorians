/**
 * Observability env, read as literal `process.env.X` so Next inlines the
 * public ones in client bundles. Varlock validates every value against
 * apps/app/.env.schema during the build.
 */
export const keys = () => ({
  BETTERSTACK_API_KEY: process.env.BETTERSTACK_API_KEY,
  BETTERSTACK_URL: process.env.BETTERSTACK_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_ORG: process.env.SENTRY_ORG,
  SENTRY_PROJECT: process.env.SENTRY_PROJECT,
});
