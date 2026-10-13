import { posthog } from "posthog-js";

import { keys } from "./keys";

export const initializeAnalytics = () => {
  const { NEXT_PUBLIC_POSTHOG_KEY } = keys();
  if (!NEXT_PUBLIC_POSTHOG_KEY) {
    return;
  }

  try {
    posthog.init(NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: "/relay-r9etm",
      // Overrides the `capture_pageview` setting
      capture_pageleave: true,
      // Disable automatic pageview capture, as we capture manually
      capture_pageview: false,
      loaded: (ph) => {
        let env = "production";

        if (process.env.NODE_ENV === "development") {
          env = "development";
        } else if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
          env = "preview";
        }

        ph.register({ env });
      },
      person_profiles: "identified_only",
      ui_host: keys().NEXT_PUBLIC_POSTHOG_HOST,
    });
  } catch (error) {
    console.error("[PostHog] Failed to initialize:", error);
    throw error;
  }
};
