import { initializeAnalytics } from "@repo/analytics/instrumentation-client";
import { initializeSentry } from "@repo/observability/client";

if (process.env.VERCEL) {
  initializeSentry();
}

initializeAnalytics();
