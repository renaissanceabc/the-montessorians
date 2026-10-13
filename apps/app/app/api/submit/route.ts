import { log } from "@montessorians/observability/log";
import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";

import { env } from "@/env";
import {
  BodyTooLargeError,
  clientIp,
  createRateLimiter,
  readBodyWithLimit,
  tooManyRequests,
} from "@/lib/rate-limit";
import { issueBody, issueTitle, submissionSchema } from "@/lib/submission";

const REPO = "renaissanceabc/the-montessorians";

/** A real submission is a few KB of JSON; anything near this is not one. */
const MAX_BODY_BYTES = 32 * 1024;

const SUBMISSIONS_PER_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;

// Per instance and best effort; the Vercel Firewall rule in docs/operations.md
// enforces a limit across every instance.
const limiter = createRateLimiter({ limit: SUBMISSIONS_PER_HOUR, windowMs: HOUR_MS });

/** Parse and validate the raw body; invalid JSON fails validation like any bad shape. */
const parseSubmission = (text: string) => {
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Left as null, which the schema rejects.
  }
  return submissionSchema.safeParse(json);
};

/**
 * POST /api/submit
 *
 * Turns a contribute-form submission into a GitHub issue for maintainers to
 * review, so contributors don't need a GitHub account. Nothing is published
 * until a maintainer merges it.
 *
 * Guarded by, in order: a per-IP rate limit (20 an hour, in memory per
 * instance, backed by a Vercel Firewall rate-limit rule on this path; see
 * docs/operations.md), a 32 KB body cap enforced while reading (before any
 * parsing), and Vercel BotID.
 */
export const POST = async (request: Request) => {
  const rate = limiter.check(clientIp(request));
  if (!rate.allowed) {
    return tooManyRequests(rate);
  }

  let text: string;
  try {
    text = await readBodyWithLimit(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return NextResponse.json({ error: "Submission is too large" }, { status: 413 });
    }
    return NextResponse.json({ error: "Could not read the submission" }, { status: 400 });
  }

  // BotID reads only the request headers, so the body can be read first.
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Request blocked" }, { status: 403 });
  }

  const parsed = parseSubmission(text);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  if (!env.GITHUB_SUBMISSIONS_TOKEN) {
    // The client falls back to the prefilled GitHub issue.
    return NextResponse.json({ error: "Submissions are not configured" }, { status: 503 });
  }

  const submission = parsed.data;
  const response = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    body: JSON.stringify({
      body: issueBody(submission),
      labels: ["profile-request", ...submission.kinds],
      title: issueTitle(submission),
    }),
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.GITHUB_SUBMISSIONS_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    method: "POST",
  });

  if (!response.ok) {
    log.error("Submit: GitHub issue creation failed", { status: response.status });
    return NextResponse.json({ error: "Could not create the request" }, { status: 502 });
  }

  // SAFETY: a 2xx from GitHub's create-issue endpoint returns the issue object, which
  // always has html_url and number.
  const issue = (await response.json()) as { html_url: string; number: number };
  return NextResponse.json({ number: issue.number, url: issue.html_url }, { status: 201 });
};
