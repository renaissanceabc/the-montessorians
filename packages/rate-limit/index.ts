import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import { Ratelimit, type RatelimitConfig } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import { keys } from "./keys";

export const redis = new Redis({
  url: keys().UPSTASH_REDIS_REST_URL,
  token: keys().UPSTASH_REDIS_REST_TOKEN,
});

export const createRateLimiter = (props: Omit<RatelimitConfig, "redis">) =>
  new Ratelimit({
    redis,
    limiter: props.limiter ?? Ratelimit.slidingWindow(10, "10 s"),
    prefix: props.prefix ?? "the-montessorians",
  });

export async function checkIpRateLimit(rateLimiter: Ratelimit, identifier?: string) {
  if (process.env.NODE_ENV === "development") {
    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: Date.now() + 60_000, // 1 minute in the future
    };
  }

  const ip = identifier ?? (await headers()).get("x-forwarded-for") ?? "anonymous";

  try {
    return await rateLimiter.limit(ip);
  } catch (error) {
    // If Redis connection fails (e.g., invalid credentials, network issues),
    // log the error but allow the request through rather than crashing
    const message = parseError(error);
    log.error("Rate limit check failed - allowing request", {
      error: message,
      ip,
    });
    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: Date.now() + 60_000,
    };
  }
}

export const { slidingWindow } = Ratelimit;
