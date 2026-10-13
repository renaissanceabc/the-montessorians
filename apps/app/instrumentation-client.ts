import { initBotId } from "botid/client/core";

// Vercel BotID: invisible bot checks on the routes that create things.
initBotId({
  protect: [{ method: "POST", path: "/api/submit" }],
});

// Sentry and PostHog are loaded on demand, so pages don't ship either SDK in
// their main bundle, and neither loads at all when its key isn't configured.
const whenIdle = (task: () => void) => {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(task, { timeout: 4000 });
  } else {
    setTimeout(task, 2000);
  }
};

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  whenIdle(async () => {
    const { initializeSentry } = await import("@montessorians/observability/client");
    initializeSentry();
  });
}

if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  whenIdle(async () => {
    const { initializeAnalytics } = await import("@montessorians/analytics/instrumentation-client");
    initializeAnalytics();
  });
}
