import { NextResponse } from "next/server";

import { clientIp, createRateLimiter, tooManyRequests } from "@/lib/rate-limit";
import { manifest, MAX_QUERIES_PAYLOAD, reconcileBatch } from "@/lib/reconcile";
import type { ReconResult } from "@/lib/reconcile";

/**
 * GET|POST /api/reconcile
 *
 * A W3C Reconciliation Service API (v0.2) endpoint, so catalogers can match
 * their own name lists against The Montessorians in OpenRefine or any other
 * reconciliation client. See docs/authority.md; the matching lives in
 * lib/reconcile.ts.
 *
 * Limits: at most 50 queries per request, 200 characters per query, 25
 * candidates per query, and 120 requests a minute per IP (in memory per
 * instance, backed by the Vercel Firewall rule in docs/operations.md).
 * A request that breaks a limit gets a 400 (or 429) rather than a partial
 * answer.
 */

const CORS = { "Access-Control-Allow-Origin": "*" };

const REQUESTS_PER_MINUTE = 120;
const limiter = createRateLimiter({ limit: REQUESTS_PER_MINUTE, windowMs: 60 * 1000 });

const JSONP_CALLBACK = /^[A-Za-z_$][\w$.]{0,63}$/u;

const badRequest = (error: string) => NextResponse.json({ error }, { headers: CORS, status: 400 });

/** Responds with JSON, or JSONP when a valid `callback` name is given. */
const respond = (
  body: ReturnType<typeof manifest> | Record<string, ReconResult>,
  jsonpCallback: string | null
) => {
  if (jsonpCallback && JSONP_CALLBACK.test(jsonpCallback)) {
    return new Response(`${jsonpCallback}(${JSON.stringify(body)})`, {
      headers: { "Content-Type": "application/javascript", ...CORS },
    });
  }
  return NextResponse.json(body, { headers: CORS });
};

const handle = (request: Request, queries: string | null, jsonpCallback: string | null) => {
  if (!queries) {
    // The service manifest is static; don't count it against the limit.
    return respond(manifest(), jsonpCallback);
  }
  const rate = limiter.check(clientIp(request));
  if (!rate.allowed) {
    return tooManyRequests(rate, CORS);
  }
  const outcome = reconcileBatch(queries);
  if (!outcome.ok) {
    return badRequest(outcome.error);
  }
  return respond(outcome.results, jsonpCallback);
};

export const GET = (request: Request) => {
  const { searchParams } = new URL(request.url);
  return handle(request, searchParams.get("queries"), searchParams.get("callback"));
};

/** Bodies larger than this can't hold a valid batch (the queries cap plus form encoding). */
const MAX_BODY_BYTES = MAX_QUERIES_PAYLOAD * 3;

export const POST = async (request: Request) => {
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Request body is too large" },
      { headers: CORS, status: 413 }
    );
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    return handle(request, body?.queries ? JSON.stringify(body.queries) : null, null);
  }
  const form = await request.formData().catch(() => null);
  const queries = form?.get("queries");
  // A file uploaded as "queries" is ignored; only a text field is read.
  return handle(request, queries instanceof Blob ? null : (queries ?? null), null);
};

export const OPTIONS = () =>
  new Response(null, {
    headers: {
      ...CORS,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
