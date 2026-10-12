import { keys as core } from "@montessorians/next-config/keys";
import { keys as observability } from "@montessorians/observability/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {},
  extends: [core(), observability()],
  runtimeEnv: {
    GITHUB_SUBMISSIONS_TOKEN: process.env.GITHUB_SUBMISSIONS_TOKEN,
  },
  server: {
    // Fine-grained token with "Issues: write" on the repo. Without it the
    // contribute form falls back to opening a prefilled GitHub issue.
    GITHUB_SUBMISSIONS_TOKEN: z.string().min(1).optional(),
  },
});
