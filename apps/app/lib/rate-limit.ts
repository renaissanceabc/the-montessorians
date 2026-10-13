// Best-effort, in-memory rate limiting for the API routes.
//
// Each serverless instance keeps its own counters, so this only slows down a
// client that keeps hitting the same warm instance. The real limit is a Vercel
// Firewall rate-limit rule in front of the routes (see docs/operations.md);
// this is the backstop when that rule is missing or a burst lands on one
// instance before the firewall reacts.

export interface RateLimitResult {
  allowed: boolean;
  /** Requests left in the current window (0 when blocked). */
  remaining: number;
  /** Seconds until the oldest counted request leaves the window. */
  retryAfter: number;
}

export interface RateLimiter {
  check: (key: string, now?: number) => RateLimitResult;
}

/** Above this many tracked keys, expired entries are swept before adding more. */
const SWEEP_THRESHOLD = 5000;

/**
 * A sliding-window limiter: at most `limit` requests per key in any
 * `windowMs` span.
 */
export const createRateLimiter = ({
  limit,
  windowMs,
}: {
  limit: number;
  windowMs: number;
}): RateLimiter => {
  const hits = new Map<string, number[]>();

  const sweep = (now: number) => {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) {
        hits.delete(key);
      }
    }
  };

  const check = (key: string, now = Date.now()): RateLimitResult => {
    if (hits.size > SWEEP_THRESHOLD) {
      sweep(now);
    }
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      const [oldest] = recent;
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
      };
    }
    recent.push(now);
    hits.set(key, recent);
    return { allowed: true, remaining: limit - recent.length, retryAfter: 0 };
  };

  return { check };
};

/**
 * The caller's IP as Vercel reports it. `x-real-ip` and the first
 * `x-forwarded-for` entry are set by Vercel's edge, not the client.
 */
export const clientIp = (request: Request): string =>
  request.headers.get("x-real-ip")?.trim() ||
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  "unknown";

/** A 429 JSON response with a Retry-After header. */
export const tooManyRequests = (
  result: RateLimitResult,
  headers: Record<string, string> = {}
): Response =>
  Response.json(
    { error: "Too many requests" },
    {
      headers: { ...headers, "Retry-After": String(result.retryAfter) },
      status: 429,
    }
  );

export class BodyTooLargeError extends Error {
  constructor(limit: number) {
    super(`Request body is larger than ${limit} bytes`);
    this.name = "BodyTooLargeError";
  }
}

/**
 * Read a request body as text, refusing more than `maxBytes`. Checks the
 * declared Content-Length first, then counts the bytes actually streamed,
 * since the header can be missing or wrong.
 */
export const readBodyWithLimit = async (request: Request, maxBytes: number): Promise<string> => {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new BodyTooLargeError(maxBytes);
  }
  if (!request.body) {
    return "";
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total <= maxBytes) {
    // oxlint-disable-next-line no-await-in-loop -- a stream is read chunk by chunk
    const { done, value } = await reader.read();
    if (done) {
      return new TextDecoder().decode(Buffer.concat(chunks));
    }
    total += value.byteLength;
    chunks.push(value);
  }
  // Stop the upload; the rest of the body is never read.
  await reader.cancel();
  throw new BodyTooLargeError(maxBytes);
};
