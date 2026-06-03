import { db, eq, gte, inArray, sql } from "@repo/database";
import { dailyFeature, profiles } from "@repo/database/schema";
import { log } from "@repo/observability/log";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getEasternDateForFeature } from "@/lib/db/profiles";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const todayISO = getEasternDateForFeature();

  // Step 1: Fetch profiles featured in the last 14 days or scheduled in the next 7
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);
  const cutoffISO = fourteenDaysAgo.toISOString().split("T")[0];

  const recentFeatures = await db
    .select()
    .from(dailyFeature)
    .where(gte(dailyFeature.date, cutoffISO));

  const usedSlugs = new Set(recentFeatures.map((r) => r.profileSlug));
  const scheduledDates = new Set(
    recentFeatures.map((r) => r.date).filter((date) => date >= todayISO) // future dates only
  );

  // Step 2: Fetch all profile slugs
  const slugsData = await db.select({ slug: profiles.slug }).from(profiles);

  const allSlugs = slugsData.map((s) => s.slug as string);
  const uniqueSlugs = allSlugs.filter((slug) => !usedSlugs.has(slug));

  // Step 3: Prepare daily feature entries for the next 14 days
  // biome-ignore lint/suspicious/noEvolvingTypes: because
  const newEntries = [];
  const usedInThisRun = new Set<string>();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateISO = date.toISOString().split("T")[0];

    if (scheduledDates.has(dateISO)) {
      continue;
    }

    let pool = uniqueSlugs.filter((slug) => !usedInThisRun.has(slug));

    // Fallback to full pool (excluding slugs already used in this run) if not enough unique ones
    if (pool.length === 0) {
      pool = allSlugs.filter((slug) => !usedInThisRun.has(slug));
    }

    if (pool.length === 0) {
      break;
    }

    const index = Math.floor(Math.random() * pool.length);
    const chosenSlug = pool[index];

    newEntries.push({ date: dateISO, profileSlug: chosenSlug });
    usedInThisRun.add(chosenSlug);
  }

  // Batch update `featured_at` for analytics (all selected profiles at once)
  if (newEntries.length > 0) {
    const slugsToUpdate = newEntries.map((e) => e.profileSlug);
    const featuredAt = new Date().toISOString();
    await db.update(profiles).set({ featuredAt }).where(inArray(profiles.slug, slugsToUpdate));
  }

  if (newEntries.length > 0) {
    await db.insert(dailyFeature).values(newEntries);
  }

  // Invalidate cached DB reads so the new schedule is visible immediately.
  revalidateTag("profiles", "default");
  revalidateTag("daily-profile", "default");
  revalidateTag("past-profiles", "default");

  log.info("Scheduled daily profile", {
    newEntries,
  });

  return NextResponse.json({
    message: `Scheduled ${newEntries.length} day(s)`,
    dates: newEntries.map((e) => e.date),
    usedSlugs: newEntries.map((e) => e.profileSlug),
  });
}
