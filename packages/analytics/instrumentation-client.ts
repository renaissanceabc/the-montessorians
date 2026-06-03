import posthog from "posthog-js";
import { keys } from "./keys";

export const initializeAnalytics = () => {
  try {
    posthog.init(keys().NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: "/relay-r9etm",
      ui_host: keys().NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: false, // Disable automatic pageview capture, as we capture manually
      capture_pageleave: true, // Overrides the `capture_pageview` setting
      loaded: (ph) => {
        let env = "production";

        if (process.env.NODE_ENV === "development") {
          env = "development";
        } else if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
          env = "preview";
        }

        ph.register({ env });
      },
    });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Critical analytics initialization error
    console.error("[PostHog] Failed to initialize:", error);
    throw error;
  }
};
