import "server-only";
import { PostHog } from "posthog-node";

import { keys } from "./keys";

const { NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST } = keys();

/** Server-side PostHog client, or null when no key is configured (local dev). */
export const analytics = NEXT_PUBLIC_POSTHOG_KEY
  ? new PostHog(NEXT_PUBLIC_POSTHOG_KEY, {
      // Don't batch events and flush immediately - we're running in a serverless environment
      flushAt: 1,
      flushInterval: 0,
      host: NEXT_PUBLIC_POSTHOG_HOST,
    })
  : null;
