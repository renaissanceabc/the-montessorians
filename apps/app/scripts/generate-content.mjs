#!/usr/bin/env node
/**
 * Build-time content generator.
 *
 * Reads the CC0 dataset (`<repo-root>/data/people/*.yaml`), validates each profile
 * against `<repo-root>/profile.schema.json`, normalizes keys to camelCase, and
 * writes a single bundled JSON (`lib/content/profiles.generated.json`) that the
 * app imports. Generating a bundled JSON (rather than reading the YAML at
 * runtime) guarantees the data is traced into the build for both static
 * generation and ISR, regardless of monorepo layout.
 *
 * Also bundles the organizations (`<repo-root>/data/organizations/*.yaml`) and the
 * merge/withdrawal log (`<repo-root>/data/authority/changes.yaml`).
 *
 * Runs before `dev`, `build`, and `typecheck`. Throws (failing the build) on a
 * malformed record. Profile images are optional.
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
const DATA_DIR = path.join(REPO_ROOT, "data", "people");
const IMAGES_DIR = path.join(REPO_ROOT, "images");
const ORGS_DIR = path.join(REPO_ROOT, "data", "organizations");
const CHANGES_PATH = path.join(REPO_ROOT, "data", "authority", "changes.yaml");
const SCHEMA_PATH = path.join(REPO_ROOT, "profile.schema.json");
const ORG_SCHEMA_PATH = path.join(REPO_ROOT, "organization.schema.json");
const CONTENT_DIR = path.join(APP_DIR, "lib", "content");
const OUT_PATH = path.join(CONTENT_DIR, "profiles.generated.json");
const ORGS_OUT_PATH = path.join(CONTENT_DIR, "organizations.generated.json");
const CHANGES_OUT_PATH = path.join(CONTENT_DIR, "changes.generated.json");
const REDIRECTS_OUT_PATH = path.join(CONTENT_DIR, "redirects.generated.json");
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
      ["log", "--diff-filter=A", "--follow", "--format=%cI", "-1", "--", `data/people/${file}`],
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
  // YAML parses an unquoted YYYY-MM-DD as a Date; keep it as that date string.
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
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

/** Write JSON, skipping the write (and the turbo cache bust) when nothing changed. */
function writeIfChanged(outPath, data) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  const next = crypto.createHash("sha1").update(json).digest("hex");
  const prev = fs.existsSync(outPath)
    ? crypto.createHash("sha1").update(fs.readFileSync(outPath)).digest("hex")
    : null;
  if (next !== prev) {
    fs.writeFileSync(outPath, json);
  }
}

function loadOrganizations() {
  const schema = JSON.parse(fs.readFileSync(ORG_SCHEMA_PATH, "utf8"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const files = fs.existsSync(ORGS_DIR)
    ? fs
        .readdirSync(ORGS_DIR)
        .filter((f) => f.endsWith(".yaml"))
        .sort()
    : [];
  const errors = [];
  const orgs = [];
  for (const file of files) {
    const raw = yaml.load(fs.readFileSync(path.join(ORGS_DIR, file), "utf8"));
    if (!validate(raw)) {
      errors.push(
        `organizations/${file}:\n` +
          (validate.errors ?? [])
            .map((e) => `  - ${e.instancePath || "(root)"} ${e.message}`)
            .join("\n")
      );
      continue;
    }
    orgs.push(snakeToCamel(raw));
  }
  if (errors.length > 0) {
    console.error(`\n✖ Organization validation failed:\n\n${errors.join("\n\n")}\n`);
    process.exit(1);
  }
  return orgs.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Redirects for next.config (which can't import the app's content modules):
 * permanent ids and old slugs freed by renames and merges → the current page.
 */
function authorityRedirects(profiles, organizations, changes) {
  const pathById = new Map([
    ...profiles.map((p) => [p.id, `/${p.slug}`]),
    ...organizations.map((o) => [o.id, `/organizations/${o.slug}`]),
  ]);
  const resolve = (id, depth = 0) => {
    if (pathById.has(id)) {
      return pathById.get(id);
    }
    const merged = changes.find((c) => c.id === id && c.action === "merged");
    return merged && depth < 5 ? resolve(merged.replacedBy, depth + 1) : null;
  };
  // Permanent URIs: /id/<id> → current page, as real 308s (a statically
  // rendered redirect would only be a meta refresh). Withdrawn ids fall through
  // to the /id/[id] page, which explains the withdrawal.
  const idRedirects = [
    ...[...pathById].map(([id, destination]) => ({ source: `/id/${id}`, destination })),
    ...changes
      .filter((c) => c.action === "merged")
      .map((c) => ({ source: `/id/${c.id}`, destination: resolve(c.id) })),
  ];
  const slugChanges = changes
    .filter((c) => c.action === "renamed" || c.action === "merged")
    .map((c) => ({ source: `/${c.slug}`, destination: resolve(c.id) }));
  return [...idRedirects, ...slugChanges].filter(
    (r) => r.destination && r.destination !== r.source
  );
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
    const hasImage = fs.existsSync(path.join(IMAGES_DIR, `${slug}.jpg`));

    const profile = snakeToCamel(raw);
    profile.imageUrl = hasImage ? `/images/${slug}.jpg` : null;
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
  syncPublicImages(profiles.filter((p) => p.imageUrl).map((p) => p.slug));

  const organizations = loadOrganizations();

  // Denormalize organization names onto references so lists can show them
  // without loading the organization index on the client.
  const orgNames = new Map(organizations.map((o) => [o.slug, o.name]));
  for (const profile of profiles) {
    for (const ref of [...(profile.schools ?? []), ...(profile.affiliations ?? [])]) {
      ref.organizationName = orgNames.get(ref.organization) ?? ref.organization;
    }
  }
  const changes = snakeToCamel(yaml.load(fs.readFileSync(CHANGES_PATH, "utf8")) ?? []);

  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  writeIfChanged(OUT_PATH, profiles);
  writeIfChanged(ORGS_OUT_PATH, organizations);
  writeIfChanged(CHANGES_OUT_PATH, changes);
  writeIfChanged(REDIRECTS_OUT_PATH, authorityRedirects(profiles, organizations, changes));

  console.log(
    `✓ Generated ${profiles.length} profiles, ${organizations.length} organizations → ${path.relative(REPO_ROOT, CONTENT_DIR)}`
  );
}

main();
