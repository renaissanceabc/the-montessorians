import { log } from "@montessorians/observability/log";
import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";

import { env } from "@/env";
import { issueBody, issueTitle, submissionSchema } from "@/lib/submission";

const REPO = "renaissanceabc/the-montessorians";

/**
 * POST /api/submit
 *
 * Turns a contribute-form submission into a GitHub issue for
 * maintainers to review, so contributors don't need a GitHub account. Guarded by
 * Vercel BotID (and the Vercel firewall). Nothing is published until a
 * maintainer merges it.
 */
export const POST = async (request: Request) => {
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Request blocked" }, { status: 403 });
  }

  const parsed = submissionSchema.safeParse(await request.json().catch(() => null));
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
