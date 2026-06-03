import "server-only";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import { checkIpRateLimit, createRateLimiter, type slidingWindow } from "@repo/rate-limit";
import { initTRPC, TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import superjson from "superjson";
import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const message = parseError(error.cause ?? error);
    if (shape.data.code === "INTERNAL_SERVER_ERROR") {
      log.error("tRPC internal error", { message, path: shape.data.path });
    }
    return { ...shape, message };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

type RateLimitOpts = {
  prefix: string;
  limiter?: ReturnType<typeof slidingWindow>;
};

export function rateLimited({ prefix, limiter }: RateLimitOpts) {
  const rl = createRateLimiter({
    prefix,
    limiter: limiter ?? Ratelimit.slidingWindow(60, "10 s"),
  });
  return t.middleware(async ({ ctx, next }) => {
    if (ctx.ip === "ssr") {
      return next({ ctx });
    }
    const { success, limit, remaining, reset } = await checkIpRateLimit(rl, ctx.ip);
    if (!success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)}s.`,
        cause: { limit, remaining, reset },
      });
    }
    return next({ ctx });
  });
}
