import crypto from "node:crypto";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { syncYamlData } from "@/lib/data/sync";

export const maxDuration = 60;

function verifyGitHubWebhook(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Revalidate cached DB reads after data sync. Tags mirror those set via
 * `cacheTag()` in `lib/db/profiles.ts`, `lib/db/tags.ts`, and the static routes.
 */
function revalidateProfileCache() {
  const tags = ["profiles", "tags"];
  for (const tag of tags) {
    revalidateTag(tag, "default");
    log.info(`Revalidated cache tag: ${tag}`);
  }
  log.info("Cache revalidation completed");
}

// Manual trigger with auth token
export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await syncYamlData();
    log.info("Manual sync triggered", { result: res });

    // Revalidate cache after successful sync
    revalidateProfileCache();

    return NextResponse.json(
      { status: "OK", res, trigger: "manual", cacheRevalidated: true },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex",
        },
      }
    );
  } catch (error) {
    const message = parseError(error);
    log.error("Manual sync failed", { message });

    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex",
        },
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("X-Hub-Signature-256");

    // Verify webhook signature
    if (!(signature && process.env.GITHUB_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isValid = verifyGitHubWebhook(body, signature, process.env.GITHUB_WEBHOOK_SECRET);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);

    // Check if this is a push to main branch
    if (payload.ref !== "refs/heads/main") {
      return NextResponse.json({ message: "Not a main branch push" }, { status: 200 });
    }

    // Trigger the sync
    const res = await syncYamlData();
    log.info("GitHub webhook triggered sync", { result: res });

    // Revalidate cache after successful sync
    revalidateProfileCache();

    return NextResponse.json(
      { status: "OK", res, cacheRevalidated: true },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex",
        },
      }
    );
  } catch (error) {
    const message = parseError(error);
    log.error("GitHub webhook sync failed", { message });

    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex",
        },
      }
    );
  }
}
