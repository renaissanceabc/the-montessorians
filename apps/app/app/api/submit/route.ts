import { log } from "@repo/observability/log";
import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { issueBody, issueTitle, submissionSchema } from "@/lib/submission";

const REPO = "renaissanceabc/the-montessorians";

/**
 * @route POST /api/submit
 * @description Turns a contribute-form submission into a GitHub issue for
 * maintainers to review, so contributors don't need a GitHub account. Guarded by
 * Vercel BotID (and the Vercel firewall). Nothing is published until a
 * maintainer merges it.
 */
export async function POST(request: Request) {
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
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.GITHUB_SUBMISSIONS_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      title: issueTitle(submission),
      body: issueBody(submission),
      labels: ["profile-request", ...submission.kinds],
    }),
  });

  if (!response.ok) {
    log.error("Submit: GitHub issue creation failed", { status: response.status });
    return NextResponse.json({ error: "Could not create the request" }, { status: 502 });
  }

  const issue = (await response.json()) as { html_url: string; number: number };
  return NextResponse.json({ url: issue.html_url, number: issue.number }, { status: 201 });
}
