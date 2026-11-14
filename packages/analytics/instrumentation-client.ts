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
      capture_pageleave: true,
      // Client-side navigations change the URL through the history API, not a
      // page load, so the first view alone would miss every page after it.
      capture_pageview: "history_change",
      // The site runs no surveys, and the surveys script is 145 KB per visit.
      disable_surveys: true,
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
