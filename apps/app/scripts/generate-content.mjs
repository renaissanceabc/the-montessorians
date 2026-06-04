#!/usr/bin/env node
/**
 * Build-time content generator.
 *
 * Reads the CC0 dataset (`<repo-root>/data/*.yaml`), validates each profile
 * against `<repo-root>/profile.schema.json`, normalizes keys to camelCase, and
 * writes a single bundled JSON (`lib/content/profiles.generated.json`) that the
 * app imports. Generating a bundled JSON (rather than reading the YAML at
 * runtime) guarantees the data is traced into the build for both static
 * generation and ISR, regardless of monorepo layout.
 *
 * Runs before `dev`, `build`, and `typecheck`. Throws (failing the build) on a
 * malformed profile or a missing image.
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import yaml from "js-yaml";

const APP_DIR = path.resolve(import.meta.dirname, "..");
const REPO_ROOT = path.resolve(APP_DIR, "..", "..");
const DATA_DIR = path.join(REPO_ROOT, "data");
const IMAGES_DIR = path.join(REPO_ROOT, "images");
const SCHEMA_PATH = path.join(REPO_ROOT, "profile.schema.json");
const OUT_PATH = path.join(APP_DIR, "lib", "content", "profiles.generated.json");
// The CC0 image dataset lives at the repo root; copy it into the app's public
// dir at build time so Next.js can serve it at /images/*. (A symlink here breaks
// `vercel build`'s output collection — it resolves to a copy onto itself.)
const PUBLIC_IMAGES_DIR = path.join(APP_DIR, "public", "images");

/**
 * Mirror the dataset images into `public/images` for the given slugs: copy each
 * (only when changed) and prune any files no longer in the dataset.
 */
function syncPublicImages(slugs) {
  fs.mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });

  const wanted = new Set(slugs.map((slug) => `${slug}.jpg`));
  for (const existing of fs.readdirSync(PUBLIC_IMAGES_DIR)) {
    if (!wanted.has(existing)) {
      fs.rmSync(path.join(PUBLIC_IMAGES_DIR, existing), { force: true });
    }
  }

  for (const slug of slugs) {
    const src = path.join(IMAGES_DIR, `${slug}.jpg`);
    const dest = path.join(PUBLIC_IMAGES_DIR, `${slug}.jpg`);
    const srcStat = fs.statSync(src);
    const destStat = fs.existsSync(dest) ? fs.statSync(dest) : null;
    // Skip the copy when size + mtime already match (avoids needless churn).
    if (!destStat || destStat.size !== srcStat.size || destStat.mtimeMs < srcStat.mtimeMs) {
      fs.copyFileSync(src, dest);
    }
  }
}

/**
 * When a profile was first added, used for the "recently added" sort and
 * sitemap lastModified. Prefers the git commit that introduced the file (stable
 * across clones); falls back to filesystem mtime, then build time.
 */
function addedAtFor(file) {
  try {
    const out = execFileSync(
      "git",
      ["log", "--diff-filter=A", "--follow", "--format=%cI", "-1", "--", `data/${file}`],
      { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    ).trim();
    if (out) {
      return out;
    }
  } catch {
    // git unavailable (shallow clone / non-git build) — fall through
  }
  try {
    return fs.statSync(path.join(DATA_DIR, file)).mtime.toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

function snakeToCamel(value) {
  if (Array.isArray(value)) {
    return value.map(snakeToCamel);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [
        key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        snakeToCamel(v),
      ])
    );
  }
  return value;
}

function main() {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort();

  const profiles = [];
  const errors = [];

  for (const file of files) {
    const raw = yaml.load(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));

    if (!validate(raw)) {
      errors.push(
        `${file}:\n` +
          (validate.errors ?? [])
            .map((e) => `  - ${e.instancePath || "(root)"} ${e.message}`)
            .join("\n")
      );
      continue;
    }

    const slug = raw.slug;
    if (`${slug}.yaml` !== file && `${slug}.yml` !== file) {
      errors.push(`${file}: slug "${slug}" does not match filename`);
      continue;
    }
    if (!fs.existsSync(path.join(IMAGES_DIR, `${slug}.jpg`))) {
      errors.push(`${file}: missing image images/${slug}.jpg`);
      continue;
    }

    const profile = snakeToCamel(raw);
    profile.imageUrl = `/images/${slug}.jpg`;
    profile.addedAt = addedAtFor(file);
    profiles.push(profile);
  }

  if (errors.length > 0) {
    console.error(
      `\n✖ Content validation failed for ${errors.length} profile(s):\n\n${errors.join("\n\n")}\n`
    );
    process.exit(1);
  }

  // Stable order: alphabetical by name (the default list order).
  profiles.sort((a, b) => a.name.localeCompare(b.name));

  // Materialize the dataset images into public/ so Next.js can serve them.
  syncPublicImages(profiles.map((p) => p.slug));

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  const json = `${JSON.stringify(profiles, null, 2)}\n`;

  // Skip the write (and the turbo cache bust) when nothing changed.
  const next = crypto.createHash("sha1").update(json).digest("hex");
  const prev = fs.existsSync(OUT_PATH)
    ? crypto.createHash("sha1").update(fs.readFileSync(OUT_PATH)).digest("hex")
    : null;
  if (next !== prev) {
    fs.writeFileSync(OUT_PATH, json);
  }

  console.log(`✓ Generated ${profiles.length} profiles → ${path.relative(REPO_ROOT, OUT_PATH)}`);
}

main();
