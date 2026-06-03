import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      RESEND_FROM: z.string().min(1),
      RESEND_TOKEN: z.string().startsWith("re_"),
      RESEND_AUDIENCE_ID: z.string().min(1),
      UNSUBSCRIBE_SECRET: z.string().min(1),
    },
    runtimeEnv: {
      RESEND_FROM: process.env.RESEND_FROM,
      RESEND_TOKEN: process.env.RESEND_TOKEN,
      RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
      UNSUBSCRIBE_SECRET: process.env.UNSUBSCRIBE_SECRET,
    },
  });
