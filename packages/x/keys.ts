import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      X_API_KEY: z.string().min(1),
      X_API_SECRET: z.string().min(1),
      X_ACCESS_TOKEN: z.string().min(1),
      X_ACCESS_TOKEN_SECRET: z.string().min(1),
    },
    runtimeEnv: {
      X_API_KEY: process.env.X_API_KEY,
      X_API_SECRET: process.env.X_API_SECRET,
      X_ACCESS_TOKEN: process.env.X_ACCESS_TOKEN,
      X_ACCESS_TOKEN_SECRET: process.env.X_ACCESS_TOKEN_SECRET,
    },
  });
