import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { BodyTooLargeError, clientIp, createRateLimiter, readBodyWithLimit } from "./rate-limit";

describe("createRateLimiter", () => {
  test("allows up to the limit in a window, then blocks with Retry-After", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    assert.equal(limiter.check("a", 0).allowed, true);
    assert.equal(limiter.check("a", 1000).allowed, true);
    const blocked = limiter.check("a", 2000);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.retryAfter, 58);
    // Other keys are unaffected.
    assert.equal(limiter.check("b", 2000).allowed, true);
  });

  test("slides: a request frees up once it leaves the window", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    assert.equal(limiter.check("a", 0).allowed, true);
    assert.equal(limiter.check("a", 999).allowed, false);
    assert.equal(limiter.check("a", 1000).allowed, true);
  });
});

describe("clientIp", () => {
  test("prefers x-real-ip, then the first x-forwarded-for hop", () => {
    const headers = { "x-forwarded-for": "203.0.113.9, 10.0.0.1" };
    assert.equal(clientIp(new Request("http://x", { headers })), "203.0.113.9");
    assert.equal(
      clientIp(new Request("http://x", { headers: { ...headers, "x-real-ip": "198.51.100.2" } })),
      "198.51.100.2"
    );
    assert.equal(clientIp(new Request("http://x")), "unknown");
  });
});

describe("readBodyWithLimit", () => {
  test("reads a body under the limit", async () => {
    const request = new Request("http://x", { body: '{"a":1}', method: "POST" });
    assert.equal(await readBodyWithLimit(request, 100), '{"a":1}');
  });

  test("rejects a body over the limit", async () => {
    const request = new Request("http://x", { body: "x".repeat(200), method: "POST" });
    await assert.rejects(readBodyWithLimit(request, 100), BodyTooLargeError);
  });

  test("rejects early on a declared Content-Length over the limit", async () => {
    const request = new Request("http://x", {
      body: "x",
      headers: { "content-length": "5000" },
      method: "POST",
    });
    await assert.rejects(readBodyWithLimit(request, 100), BodyTooLargeError);
  });
});
