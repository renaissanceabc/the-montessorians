import { log as logtail } from "@logtail/next";

// Better Stack only in production with a key set; plain console otherwise.
export const log =
  process.env.NODE_ENV === "production" && process.env.BETTERSTACK_API_KEY ? logtail : console;
