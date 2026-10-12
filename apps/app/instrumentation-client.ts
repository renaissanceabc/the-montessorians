import { initializeAnalytics } from "@repo/analytics/instrumentation-client";
import { initializeSentry } from "@repo/observability/client";
import { initBotId } from "botid/client/core";

if (process.env.VERCEL) {
  initializeSentry();
}

initializeAnalytics();

// Vercel BotID: invisible bot checks on the routes that create things.
initBotId({
  protect: [{ path: "/api/submit", method: "POST" }],
});
