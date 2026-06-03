import { db, eq, notInArray } from "@repo/database";
import { links, profiles, profileTags, tags } from "@repo/database/schema";
import { log } from "@repo/observability/log";
import { head as headBlob, put as putBlob } from "@vercel/blob";
import yaml from "js-yaml";
import type { z } from "zod";
import { ProfileSyncSchema } from "../schema";
import { convertKeysToCamelCase, toTitleCase } from "../utils";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_DATA_URL = process.env.GITHUB_DATA_URL;

type Profile = z.infer<typeof ProfileSyncSchema>;

async function getProfileSlugsFromGitHub(): Promise<{
  slugs: string[];
  error?: string;
}> {
  const res = await fetch(
    "https://api.github.com/repos/renaissanceabc/the-montessorians/contents/data",
    GITHUB_TOKEN ? { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } } : undefined
  );

  if (!res.ok) {
    const body = await res.text();
    const errorMsg = `Failed to fetch profile slugs from GitHub: ${res.status} ${res.statusText}. Response: ${body}`;
    log.error(errorMsg);
    return { slugs: [], error: errorMsg };
  }

  const files = (await res.json()) as Array<{ name: string }>;
  log.info(`Found ${files.length} files in GitHub data directory`);

  const yamlFiles = files.filter((f) => f.name.endsWith(".yaml"));
  log.info(`Found ${yamlFiles.length} YAML files`);

  return { slugs: yamlFiles.map((f) => f.name.replace(".yaml", "")) };
}

export async function syncYamlData() {
  const profilesAdded: string[] = [];
  const profilesUpdated: string[] = [];
  const tagsAdded: string[] = [];
  const { slugs: profileSlugs, error: githubError } = await getProfileSlugsFromGitHub();

  // Safety check: If we get 0 profiles from GitHub, something is wrong
  if (profileSlugs.length === 0) {
    const errorMsg = githubError
      ? `No profiles found from GitHub. GitHub API error: ${githubError}`
      : "No profiles found from GitHub. This could indicate an API issue.";
    log.error(`Aborting sync to prevent data loss. ${errorMsg}`);
    throw new Error(errorMsg);
  }

  log.info(`Syncing ${profileSlugs.length} profiles`);
  for (const slug of profileSlugs) {
    const profile = await fetchAndValidate(slug);

    if (!profile) {
      continue;
    }

    const imageUrl = await uploadImage(profile.slug);

    if (!imageUrl) {
      log.warn(`Skipping profile ${profile.slug} due to missing image`);
      continue;
    }

    const addedTags = await upsertTags(profile);
    const operation = await upsertProfile(profile, imageUrl);
    await upsertProfileTags(profile);
    await upsertLinks(profile);

    tagsAdded.push(...addedTags);

    if (operation === "inserted") {
      profilesAdded.push(slug);
    } else {
      profilesUpdated.push(slug);
    }
  }

  const deletedProfiles = await removeDeletedProfiles(profileSlugs);
  const deletedTags = await removeOrphanedTags();

  return {
    profilesAdded: {
      synced: profilesAdded,
      total: profilesAdded.length,
    },
    profilesUpdated: {
      synced: profilesUpdated,
      total: profilesUpdated.length,
    },
    profilesDeleted: {
      deleted: deletedProfiles,
      total: deletedProfiles.length,
    },
    tagsAdded: {
      synced: tagsAdded,
      total: tagsAdded.length,
    },
    tagsDeleted: {
      deleted: deletedTags,
      total: deletedTags.length,
    },
  };
}

async function upsertTags(profile: Profile) {
  const tagsData = profile.tags?.map((tag) => ({
    slug: tag,
    label: toTitleCase(tag),
  }));

  if (tagsData?.length) {
    const result = await db.insert(tags).values(tagsData).onConflictDoNothing();
    return result.map((r: { slug: string }) => r.slug) as string[];
  }

  return [];
}

async function upsertProfile(
  profile: Profile,
  imageUrl: string | undefined
): Promise<"inserted" | "updated"> {
  const result = await db
    .insert(profiles)
    .values({
      slug: profile.slug,
      name: profile.name,
      tagline: profile.tagline,
      bio: profile.bio,
      education: profile.education,
      educationNotes: profile.educationNotes,
      notableAchievements: profile.notableAchievements,
      quotes: profile.quotes,
      imageUrl,
    })
    .onConflictDoUpdate({
      target: profiles.slug,
      set: {
        name: profile.name,
        tagline: profile.tagline,
        bio: profile.bio,
        education: profile.education,
        educationNotes: profile.educationNotes,
        notableAchievements: profile.notableAchievements,
        quotes: profile.quotes,
        imageUrl,
      },
    });

  // If length is 1, it was an insert. If length is 2, it was an update.
  return result.length === 1 ? "inserted" : "updated";
}

async function upsertProfileTags(profile: Profile) {
  // Delete existing tags for this profile to sync with YAML
  await db.delete(profileTags).where(eq(profileTags.profileSlug, profile.slug));

  // Insert new tags from YAML
  const profileTagsData = profile.tags?.map((tag) => ({
    profileSlug: profile.slug,
    tagSlug: tag,
  }));

  if (profileTagsData?.length) {
    await db.insert(profileTags).values(profileTagsData);
  }
}

async function upsertLinks(profile: Profile) {
  // Delete existing links for this profile to sync with YAML
  await db.delete(links).where(eq(links.profileSlug, profile.slug));

  // Insert new links from YAML
  const linksData = profile.links?.map((link) => ({
    profileSlug: profile.slug,
    url: link.url,
    type: link.type,
  }));

  if (linksData?.length) {
    await db.insert(links).values(linksData);
  }
}

async function removeDeletedProfiles(profileSlugs: string[]) {
  // Safety check: Don't delete anything if we have no profiles from GitHub
  if (profileSlugs.length === 0) {
    log.warn("Skipping profile deletion - no profiles from GitHub");
    return [];
  }

  const dbSlugs = await db.select().from(profiles).where(notInArray(profiles.slug, profileSlugs));

  // Additional safety: Don't delete more than 10 profiles at once
  if (dbSlugs.length > 10) {
    log.error(`Attempting to delete ${dbSlugs.length} profiles. This seems wrong. Aborting.`);
    throw new Error(`Safety check failed: Attempting to delete ${dbSlugs.length} profiles`);
  }

  for (const dbSlug of dbSlugs) {
    await db.delete(profiles).where(eq(profiles.slug, dbSlug.slug));
  }

  if (dbSlugs.length > 0) {
    return dbSlugs.map((dbSlug) => dbSlug.slug);
  }

  return [];
}

async function removeOrphanedTags(): Promise<string[]> {
  // Find tags that aren't referenced by any profile
  const usedTagSlugs = await db.select({ tagSlug: profileTags.tagSlug }).from(profileTags);

  const usedSlugs = new Set(usedTagSlugs.map((t) => t.tagSlug));

  const allTags = await db.select({ slug: tags.slug }).from(tags);
  const orphaned = allTags.filter((tag) => !usedSlugs.has(tag.slug));

  if (orphaned.length > 0) {
    const orphanedSlugs = orphaned.map((t) => t.slug);
    for (const tagSlug of orphanedSlugs) {
      await db.delete(tags).where(eq(tags.slug, tagSlug));
    }
    log.info(`Deleted ${orphaned.length} orphaned tags`);
    return orphanedSlugs;
  }

  return [];
}

async function fetchAndValidate(slug: string) {
  const url = `${GITHUB_DATA_URL}/data/${slug}.yaml`;
  log.info(`${slug}`);
  const yamlRes = await fetch(url);

  if (!yamlRes.ok) {
    log.error(`Failed to fetch ${slug}: ${yamlRes.statusText}`);
    return null;
  }

  const raw = await yamlRes.text();
  const parsed = yaml.load(raw);

  // biome-ignore lint/suspicious/noExplicitAny: Complex shapes
  const camelized = convertKeysToCamelCase(parsed as Record<string, any>);
  const validated = ProfileSyncSchema.safeParse(camelized);

  if (!validated.success) {
    log.error(`Invalid data for ${url}: ${validated.error}`);
    return null;
  }

  return validated.data;
}

async function uploadImage(slug: string): Promise<string | undefined> {
  const imageFilename = `${slug}.jpg`;
  const imageKey = `images/profiles/${imageFilename}`;

  const exists = await headBlob(imageKey, {
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
    .then(() => true)
    .catch(() => false);

  if (exists) {
    log.info(`Image ${imageFilename} already exists`);
    return `https://${process.env.BLOB_PUBLIC_BASE_URL}/images/profiles/${imageFilename}`;
  }

  log.info(`Uploading to blob: ${imageKey}`);

  const imageRes = await fetch(`${GITHUB_DATA_URL}/images/${imageFilename}`);

  if (!imageRes.ok) {
    log.error(`Failed to fetch image for ${slug}: ${imageRes.status} - URL: ${imageRes.url}`);
    return;
  }

  const blob = await imageRes.blob();
  const result = await putBlob(imageKey, blob, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  log.info(`Uploaded to blob: ${imageKey} (${result.url})`);

  return result.url;
}
