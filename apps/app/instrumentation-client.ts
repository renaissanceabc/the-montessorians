import { initializeAnalytics } from "@repo/analytics/instrumentation-client";
import { initializeSentry } from "@repo/observability/client";
import { initBotId } from "botid/client/core";

// Off unless a DSN is configured (e.g. local dev).
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  initializeSentry();
}

initializeAnalytics();

// Vercel BotID: invisible bot checks on the routes that create things.
initBotId({
  protect: [{ path: "/api/submit", method: "POST" }],
});
