import { initializeAnalytics } from "@montessorians/analytics/instrumentation-client";
import { initializeSentry } from "@montessorians/observability/client";
import { initBotId } from "botid/client/core";

// Off unless a DSN is configured (e.g. local dev).
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  initializeSentry();
}

initializeAnalytics();

// Vercel BotID: invisible bot checks on the routes that create things.
initBotId({
  protect: [{ method: "POST", path: "/api/submit" }],
});
