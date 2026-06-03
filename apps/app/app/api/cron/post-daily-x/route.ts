import { log } from "@repo/observability/log";
import { XClient } from "@repo/x";
import { NextResponse } from "next/server";
import { getDailyProfileFromFeatureDB, getEasternDateForFeature } from "@/lib/db/profiles";
import { siteUrl } from "@/lib/utils";

/**
 * Extract Twitter handle from X/Twitter URL
 * Supports both x.com and twitter.com URLs
 */
function extractTwitterHandle(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Match patterns like /username or /username/
    const match = pathname.match(/^\/([a-zA-Z0-9_]+)\/?$/);
    if (match && match[1]) {
      return match[1];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Construct tweet text from profile data
 */
function constructTweetText(profile: {
  name: string;
  tagline: string | null;
  slug: string;
  links: Array<{ type: string; url: string }>;
}): string {
  const { name, tagline, slug, links } = profile;

  // Find X/Twitter link
  const xLink = links.find((link) => link.type === "x");
  const twitterHandle = xLink ? extractTwitterHandle(xLink.url) : null;

  // Get tagline or use empty string
  const description = tagline || "";

  // Build tweet text
  let tweetText = "";

  if (twitterHandle) {
    tweetText = `${name} (@${twitterHandle})\n\n${description}\n\nLearn more and discover others on The Montessorians 👇\n${siteUrl}/${slug}`;
  } else {
    tweetText = `${name}\n\n${description}\n\nLearn more and discover others on The Montessorians 👇\n${siteUrl}/${slug}`;
  }

  // Truncate if too long (X limit is 280 characters)
  const maxLength = 280;
  if (tweetText.length > maxLength) {
    // Truncate tagline if needed, but keep the structure
    const baseText = twitterHandle ? `${name} (@${twitterHandle})\n\n` : `${name}\n\n`;
    const footer = `\n\nLearn more about ${name} and discover others on The Montessorians: ${siteUrl}/${slug}`;
    const availableLength = maxLength - baseText.length - footer.length;

    if (availableLength > 0) {
      const truncatedDescription = description.slice(0, availableLength - 3) + "...";
      tweetText = `${baseText}${truncatedDescription}${footer}`;
    } else {
      // If even the base structure is too long, just use the link
      tweetText = `Learn more about ${name} and discover others on The Montessorians: ${siteUrl}/${slug}`;
    }
  }

  return tweetText;
}

/**
 * Fetch OG image from the API endpoint
 */
async function fetchOGImage(slug: string): Promise<Buffer | null> {
  try {
    const ogImageUrl = `${siteUrl}/api/og/${slug}`;
    const response = await fetch(ogImageUrl);

    if (!response.ok) {
      log.warn("Failed to fetch OG image", {
        slug,
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    log.error("Error fetching OG image", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for dry-run mode: query parameter takes precedence over env var
  const url = new URL(request.url);
  const dryRunParam = url.searchParams.get("dry-run");
  const isDryRun =
    dryRunParam === "true" || (dryRunParam === null && process.env.X_DRY_RUN === "true");

  // Check for preview date parameter (format: YYYYMMDD, e.g., 20251105)
  // Preview only works in dry-run mode for safety
  const previewParam = url.searchParams.get("preview");
  let previewDate: string | undefined;
  if (previewParam) {
    // Preview date can only be used with dry-run mode
    if (!isDryRun) {
      return NextResponse.json(
        {
          error:
            "Preview date can only be used with dry-run mode. Add ?dry-run=true to your request.",
        },
        { status: 400 }
      );
    }

    // Validate format: should be 8 digits (YYYYMMDD)
    if (!/^\d{8}$/.test(previewParam)) {
      return NextResponse.json(
        {
          error: "Invalid preview date format. Expected YYYYMMDD (e.g., 20251105)",
        },
        { status: 400 }
      );
    }
    // Convert YYYYMMDD to YYYY-MM-DD
    const year = previewParam.slice(0, 4);
    const month = previewParam.slice(4, 6);
    const day = previewParam.slice(6, 8);
    previewDate = `${year}-${month}-${day}`;

    // Validate the date is actually valid
    const dateObj = new Date(previewDate);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json(
        {
          error: "Invalid date. Please provide a valid date in YYYYMMDD format",
        },
        { status: 400 }
      );
    }
  }

  try {
    // Get today's daily profile (or preview date if provided)
    const profile = await getDailyProfileFromFeatureDB(previewDate || getEasternDateForFeature());

    if (!profile) {
      const dateMessage = previewDate
        ? `No daily profile found for preview date ${previewDate}`
        : "No daily profile found for today";
      log.warn(dateMessage);
      return NextResponse.json({ error: dateMessage }, { status: 404 });
    }

    // Extract Twitter handle for response
    const xLink = profile.links.find((link: { type: string; url: string }) => link.type === "x");
    const twitterHandle = xLink ? extractTwitterHandle(xLink.url) : null;

    // Construct tweet text
    const tweetText = constructTweetText(profile);

    if (isDryRun) {
      log.info("[DRY-RUN] Would post daily profile to X", {
        profileSlug: profile.slug,
        profileName: profile.name,
        tweetLength: tweetText.length,
        twitterHandle,
        previewDate: previewDate || null,
      });
    } else {
      log.info("Posting daily profile to X", {
        profileSlug: profile.slug,
        profileName: profile.name,
        tweetLength: tweetText.length,
      });
    }

    // Fetch OG image
    const ogImage = await fetchOGImage(profile.slug);

    if (isDryRun) {
      // Generate mock tweet ID
      const mockTweetId = `dry-run-mock-tweet-id-${Date.now()}`;
      const ogImageUrl = `${siteUrl}/api/og/${profile.slug}`;

      log.info("[DRY-RUN] Tweet text would be", {
        tweetText,
        tweetLength: tweetText.length,
        hasImage: ogImage !== null,
        imageSize: ogImage?.length || 0,
        mediaUrl: ogImageUrl,
      });

      return NextResponse.json({
        dryRun: true,
        message: "Dry-run completed - tweet would have been posted",
        tweetText,
        tweetLength: tweetText.length,
        tweetId: mockTweetId,
        profileSlug: profile.slug,
        profileName: profile.name,
        hasImage: ogImage !== null,
        imageSize: ogImage?.length || 0,
        mediaUrl: ogImageUrl,
        twitterHandle: twitterHandle || null,
        previewDate: previewDate || null,
      });
    }

    // Production mode: Actually post to X
    // Initialize X client and post tweet
    const xClient = new XClient();

    let tweetId: string;

    if (ogImage) {
      // Post with image
      tweetId = await xClient.createTweetWithImage(tweetText, ogImage, "image/png");
      log.info("Successfully posted tweet with image to X", {
        tweetId,
        profileSlug: profile.slug,
      });
    } else {
      // Post text only if image fetch failed
      tweetId = await xClient.createTweet({
        text: tweetText,
      });
      log.info("Successfully posted tweet (text only) to X", {
        tweetId,
        profileSlug: profile.slug,
      });
    }

    return NextResponse.json({
      message: "Tweet posted successfully",
      tweetId,
      profileSlug: profile.slug,
      profileName: profile.name,
      hasImage: ogImage !== null,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logPrefix = isDryRun ? "[DRY-RUN] " : "";
    log.error(`${logPrefix}Failed to post daily profile to X`, {
      error: errorMessage,
      dryRun: isDryRun,
    });

    return NextResponse.json({ error: errorMessage, dryRun: isDryRun }, { status: 500 });
  }
}
