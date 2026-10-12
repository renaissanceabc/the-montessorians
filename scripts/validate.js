#!/usr/bin/env node

/**
 * Validates the dataset: every profile and organization against its schema,
 * plus the cross-record rules that make it a name authority (unique permanent
 * ids, no id ever disappearing without a changes.yaml entry, references that
 * resolve, likely duplicates).
 *
 * Set BASE_REF (e.g. BASE_REF=origin/main) to also check that no id present on
 * that ref was removed without being recorded in authority/changes.yaml.
 */

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const dataDir = path.join(ROOT, "data");
const orgDir = path.join(ROOT, "organizations");
const imageDir = path.join(ROOT, "images");
const changesPath = path.join(ROOT, "authority", "changes.yaml");
const checksumPath = path.join(ROOT, ".checksums.json");

const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: "fast" });
addFormats(ajv);

const profileSchemaText = fs.readFileSync(path.join(ROOT, "profile.schema.json"), "utf8");
const orgSchemaText = fs.readFileSync(path.join(ROOT, "organization.schema.json"), "utf8");
const validateProfile = ajv.compile(JSON.parse(profileSchemaText));
const validateOrg = ajv.compile(JSON.parse(orgSchemaText));

const yamlFiles = (dir) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".yaml"))
        .sort()
    : [];

const sha = (content) => crypto.createHash("sha256").update(content).digest("hex");

// Per-file checks are cached by content (+ schema), cross-record checks always run.
let checksumCache = {};
if (fs.existsSync(checksumPath)) {
  const content = fs.readFileSync(checksumPath, "utf8").trim();
  if (content) {
    checksumCache = JSON.parse(content);
  }
}

const reports = new Map();
const warnings = [];
const report = (file, message) => {
  if (!reports.has(file)) {
    reports.set(file, []);
  }
  reports.get(file).push(`- ${message}`);
};

function schemaErrors(validate, doc) {
  if (validate(doc)) {
    return [];
  }
  return (validate.errors ?? []).map((err) => `${err.instancePath || "(root)"}: ${err.message}`);
}

// --- Organizations -----------------------------------------------------------

const orgs = [];
for (const file of yamlFiles(orgDir)) {
  const doc = yaml.load(fs.readFileSync(path.join(orgDir, file), "utf8"));
  const label = `organizations/${file}`;
  for (const message of schemaErrors(validateOrg, doc)) {
    report(label, message);
  }
  if (doc?.slug && `${doc.slug}.yaml` !== file) {
    report(label, `slug "${doc.slug}" does not match filename`);
  }
  orgs.push({ file: label, doc });
}
const orgSlugs = new Set(orgs.map((o) => o.doc?.slug));

// --- Profiles ----------------------------------------------------------------

const profiles = [];
let skipped = 0;
for (const file of yamlFiles(dataDir)) {
  const filePath = path.join(dataDir, file);
  const fileContent = fs.readFileSync(filePath, "utf8");
  const doc = yaml.load(fileContent);
  const label = `data/${file}`;
  profiles.push({ file: label, doc });

  const slug = doc?.slug;
  const imagePath = path.join(imageDir, `${slug}.jpg`);
  const imageContent = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : "";
  const checksum = sha(profileSchemaText + fileContent + imageContent);
  if (checksumCache[file] === checksum) {
    skipped++;
    continue;
  }

  const errorsBefore = reports.get(label)?.length ?? 0;

  for (const message of schemaErrors(validateProfile, doc)) {
    report(label, message);
  }
  if (slug && `${slug}.yaml` !== file) {
    report(label, `slug "${slug}" does not match filename`);
  }
  if (typeof doc?.tagline === "string" && doc.tagline.trim().endsWith(".")) {
    report(label, "/tagline: Tagline should not end with a period");
  }
  if (doc?.birth_year && doc?.death_year && doc.birth_year > doc.death_year) {
    report(label, "birth_year is after death_year");
  }
  if (doc?.kind === "contributor" && !(doc.contributions?.length || doc.sources?.length)) {
    report(label, "contributors need at least one documented contribution or source");
  }
  if (doc?.verification === "verified" && !doc.sources?.some((s) => s.url)) {
    report(label, 'verification "verified" needs a source with a url');
  }

  // Images are optional, but must be .jpg when present.
  if (!fs.existsSync(imagePath)) {
    const alt = [".jpeg", ".png", ".webp", ".gif", ".tiff", ".heic", ".heif", ".avif"]
      .map((ext) => `${slug}${ext}`)
      .find((name) => fs.existsSync(path.join(imageDir, name)));
    if (alt) {
      report(label, `Image found but not in .jpg format: ${alt}`);
    }
  }

  if ((reports.get(label)?.length ?? 0) === errorsBefore) {
    checksumCache[file] = checksum;
  }
}

// --- Cross-record rules ------------------------------------------------------

const changes = yaml.load(fs.readFileSync(changesPath, "utf8")) ?? [];
if (!Array.isArray(changes)) {
  report("authority/changes.yaml", "must be a list");
}

const records = [...profiles, ...orgs];
const liveIds = new Map();
const liveSlugs = new Map();
for (const { file, doc } of records) {
  if (!doc?.id) {
    continue;
  }
  if (liveIds.has(doc.id)) {
    report(file, `id ${doc.id} is also used by ${liveIds.get(doc.id)}`);
  }
  liveIds.set(doc.id, file);
}
for (const { file, doc } of profiles) {
  if (doc?.slug && liveSlugs.has(doc.slug)) {
    report(file, `slug ${doc.slug} is also used by ${liveSlugs.get(doc.slug)}`);
  }
  liveSlugs.set(doc?.slug, file);
}

for (const { file, doc } of profiles) {
  for (const ref of [...(doc?.schools ?? []), ...(doc?.affiliations ?? [])]) {
    if (!orgSlugs.has(ref.organization)) {
      report(
        file,
        `unknown organization "${ref.organization}" (add organizations/${ref.organization}.yaml)`
      );
    }
  }
}
for (const { file, doc } of orgs) {
  if (doc?.parent && !orgSlugs.has(doc.parent)) {
    report(file, `unknown parent organization "${doc.parent}"`);
  }
}

const changedIds = new Set();
for (const [i, change] of (Array.isArray(changes) ? changes : []).entries()) {
  const where = `authority/changes.yaml[${i}]`;
  if (!/^tmo?[0-9]{6,7}$/.test(change?.id ?? "")) {
    report(where, "id is missing or malformed");
    continue;
  }
  if (!["merged", "withdrawn", "renamed"].includes(change.action)) {
    report(where, "action must be merged, withdrawn, or renamed");
  }
  // YAML parses an unquoted YYYY-MM-DD as a Date.
  const date =
    change.date instanceof Date
      ? change.date.toISOString().slice(0, 10)
      : String(change.date ?? "");
  if (!(change.slug && /^\d{4}-\d{2}-\d{2}$/.test(date))) {
    report(where, "slug and date (YYYY-MM-DD) are required");
  }
  if (change.action === "renamed") {
    if (!liveIds.has(change.id)) {
      report(where, `renamed record ${change.id} does not exist`);
    }
    if (liveSlugs.has(change.slug)) {
      report(where, `old slug ${change.slug} is in use by a live record`);
    }
    continue;
  }
  changedIds.add(change.id);
  if (liveIds.has(change.id)) {
    report(where, `${change.id} is ${change.action} but still exists in ${liveIds.get(change.id)}`);
  }
  if (change.action === "merged" && !liveIds.has(change.replaced_by)) {
    report(where, `replaced_by ${change.replaced_by} is not a live record`);
  }
}

// Ids are permanent: anything present on the base ref must still exist or be recorded.
if (process.env.BASE_REF) {
  const ref = process.env.BASE_REF;
  const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
  for (const dir of ["data", "organizations"]) {
    let listing = "";
    try {
      listing = git("ls-tree", "--name-only", `${ref}:${dir}`);
    } catch {
      continue;
    }
    for (const name of listing.split("\n").filter((n) => n.endsWith(".yaml"))) {
      const doc = yaml.load(git("show", `${ref}:${dir}/${name}`));
      if (doc?.id && !liveIds.has(doc.id) && !changedIds.has(doc.id)) {
        report(
          `${dir}/${name}`,
          `id ${doc.id} existed on ${ref} but was removed without an authority/changes.yaml entry`
        );
      }
    }
  }
}

// Likely duplicates: same normalized name (error) or very similar names (warning).
const normalize = (s) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
function similarity(a, b) {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) {
    d[0][j] = j;
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return 1 - d[m][n] / Math.max(m, n, 1);
}
const distinct = new Set(
  (yaml.load(fs.readFileSync(path.join(ROOT, "authority", "distinct.yaml"), "utf8")) ?? []).map(
    (pair) => [...pair].sort().join("|")
  )
);
const slugOf = (file) => path.basename(file, ".yaml");
const names = profiles.flatMap(({ file, doc }) =>
  [doc?.name, ...(doc?.name_variants ?? [])]
    .filter(Boolean)
    .map((n) => ({ file, name: normalize(n) }))
);
for (let i = 0; i < names.length; i++) {
  for (let j = i + 1; j < names.length; j++) {
    const a = names[i];
    const b = names[j];
    if (a.file === b.file) {
      continue;
    }
    if (a.name === b.name) {
      report(a.file, `possible duplicate of ${b.file} ("${a.name}")`);
    } else if (
      similarity(a.name, b.name) >= 0.9 &&
      !distinct.has([slugOf(a.file), slugOf(b.file)].sort().join("|"))
    ) {
      warnings.push(
        `${a.file} and ${b.file} have very similar names — check they are different people`
      );
    }
  }
}

// --- Output ------------------------------------------------------------------

// Never cache a file that failed a cross-record check.
for (const file of reports.keys()) {
  delete checksumCache[file.replace(/^data\//, "")];
}
fs.writeFileSync(
  checksumPath,
  `${JSON.stringify(Object.fromEntries(Object.entries(checksumCache).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`
);

console.log(`${profiles.length} profiles, ${orgs.length} organizations found`);
console.log(`- ${reports.size} with errors`);
console.log(`- ${skipped} profiles skipped by the per-file cache (cross-record checks always run)`);

if (warnings.length > 0) {
  console.log("\n⚠ Warnings:");
  for (const warning of new Set(warnings)) {
    console.log(`  - ${warning}`);
  }
}

if (reports.size > 0) {
  console.log("\n❌ Invalid:");
  [...reports].forEach(([file, errors], index) => {
    console.log(`${index + 1}. ${file}`);
    for (const err of errors) {
      console.log(`  ${err}`);
    }
  });
  process.exit(1);
}
