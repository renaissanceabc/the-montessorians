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
import { load } from "js-yaml";

const APP_DIR = path.resolve(import.meta.dirname, "..");
const REPO_ROOT = path.resolve(APP_DIR, "..", "..");
const DATA_DIR = path.join(REPO_ROOT, "data", "people");
const IMAGES_DIR = path.join(REPO_ROOT, "images");
const ORGS_DIR = path.join(REPO_ROOT, "data", "organizations");
const CHANGES_PATH = path.join(REPO_ROOT, "data", "authority", "changes.yaml");
const TAGS_PATH = path.join(REPO_ROOT, "data", "authority", "tags.yaml");

/** Retired tags (data/authority/tags.yaml aliases) → their replacement's page. */
const tagRedirects = () =>
  (load(fs.readFileSync(TAGS_PATH, "utf-8")) ?? []).flatMap((tag) =>
    (tag.aliases ?? []).map((alias) => ({
      destination: `/tags/${tag.slug}`,
      source: `/tags/${alias}`,
    }))
  );
const SCHEMA_PATH = path.join(REPO_ROOT, "profile.schema.json");
const ORG_SCHEMA_PATH = path.join(REPO_ROOT, "organization.schema.json");

const SCHEMA_REFERENCE_OUT_PATH = path.join(
  APP_DIR,
  "lib",
  "content",
  "schema-reference.generated.json"
);

// The profile fields a submission may include, in profile-file order, and who
// they apply to. Everything else in the schema is set by maintainers.
const SUBMISSION_FIELDS = [
  ["name", "both"],
  ["kind", "both"],
  ["roles", "contributor"],
  ["tagline", "both"],
  ["bio", "both"],
  ["tags", "both"],
  ["education", "alum"],
  ["education_notes", "alum"],
  ["schools", "alum"],
  ["montessori_notes", "contributor"],
  ["affiliations", "contributor"],
  ["contributions", "contributor"],
  ["notable_achievements", "alum"],
  ["quotes", "both"],
  ["sources", "both"],
  ["links", "both"],
];
// Required to submit (the profile schema's own `required` also includes id and
// slug, which maintainers and the form set).
const SUBMISSION_REQUIRED = new Set(["name", "kind", "tagline", "tags", "sources"]);

const resolveRef = (schema, node) =>
  node?.$ref ? schema.definitions[node.$ref.replace("#/definitions/", "")] : node;

const describeType = (schema, rawNode) => {
  const node = resolveRef(schema, rawNode);
  if (rawNode?.$ref?.endsWith("/year")) {
    return "year";
  }
  if (node?.oneOf) {
    return "text or list";
  }
  if (node?.type === "array") {
    const item = resolveRef(schema, node.items);
    return item?.type === "object" ? "list of entries" : "list of text";
  }
  if (node?.type === "integer") {
    return "number";
  }
  return node?.format === "uri" ? "URL" : "text";
};

const allowedValues = (schema, rawNode) => {
  const node = resolveRef(schema, rawNode);
  return node?.enum ?? node?.items?.enum ?? node?.oneOf?.[0]?.enum ?? null;
};

/** A readable field reference for the contribute form's YAML mode. */
const schemaReference = (organizations) => {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf-8"));
  const vocabulary = load(fs.readFileSync(TAGS_PATH, "utf-8")) ?? [];
  const orgSlugs = organizations.map((o) => o.slug).toSorted();
  const describeChildren = (node) => {
    const item = resolveRef(schema, node?.items);
    if (item?.type !== "object") {
      return null;
    }
    const required = new Set(item.required);
    return Object.entries(item.properties).map(([key, child]) => ({
      description: resolveRef(schema, child)?.description ?? child.description ?? null,
      key,
      required: required.has(key),
      type: describeType(schema, child),
      values: key === "organization" ? orgSlugs : allowedValues(schema, child),
    }));
  };
  const fields = SUBMISSION_FIELDS.map(([key, appliesTo]) => {
    const node = schema.properties[key];
    return {
      appliesTo,
      description: node.description ?? null,
      items: describeChildren(node),
      key,
      required: SUBMISSION_REQUIRED.has(key) || (key === "roles" ? "contributors" : false),
      type: describeType(schema, node),
      values: key === "tags" ? vocabulary.map((t) => t.slug) : allowedValues(schema, node),
    };
  });
  const submitted = new Set(SUBMISSION_FIELDS.map(([key]) => key));
  return {
    fields,
    maintainerOnly: Object.keys(schema.properties).filter((key) => !submitted.has(key)),
  };
};

const CONTENT_DIR = path.join(APP_DIR, "lib", "content");
const OUT_PATH = path.join(CONTENT_DIR, "profiles.generated.json");
const ORGS_OUT_PATH = path.join(CONTENT_DIR, "organizations.generated.json");
const CHANGES_OUT_PATH = path.join(CONTENT_DIR, "changes.generated.json");
const REDIRECTS_OUT_PATH = path.join(CONTENT_DIR, "redirects.generated.json");
const HEADERS_OUT_PATH = path.join(CONTENT_DIR, "headers.generated.json");
// The CC0 image dataset lives at the repo root; copy it into the app's public
// dir at build time so Next.js can serve it at /images/*. (A symlink here breaks
// `vercel build`'s output collection — it resolves to a copy onto itself.)
const PUBLIC_IMAGES_DIR = path.join(APP_DIR, "public", "images");

/**
 * Mirror the dataset images into `public/images` for the given slugs: copy each
 * (only when changed) and prune any files no longer in the dataset.
 */
const syncPublicImages = (slugs) => {
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
};

const LOGOS_DIR = path.join(IMAGES_DIR, "organizations");
const PUBLIC_LOGOS_DIR = path.join(APP_DIR, "public", "logos");

/** The organization's logo file name (svg preferred), if the dataset has one. */
const logoFileFor = (slug) =>
  [`${slug}.svg`, `${slug}.png`].find((name) => fs.existsSync(path.join(LOGOS_DIR, name)));

/** Mirror organization logos into `public/logos`, pruning removed ones. */
const syncPublicLogos = (names) => {
  fs.mkdirSync(PUBLIC_LOGOS_DIR, { recursive: true });
  const wanted = new Set(names);
  for (const existing of fs.readdirSync(PUBLIC_LOGOS_DIR)) {
    if (!wanted.has(existing)) {
      fs.rmSync(path.join(PUBLIC_LOGOS_DIR, existing), { force: true });
    }
  }
  for (const name of names) {
    fs.copyFileSync(path.join(LOGOS_DIR, name), path.join(PUBLIC_LOGOS_DIR, name));
  }
};

/** Commit dates (ISO) of the commits that added a path, following renames. */
const gitAddedDates = (filePath) =>
  execFileSync("git", ["log", "--diff-filter=A", "--follow", "--format=%cI", "--", filePath], {
    cwd: REPO_ROOT,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
  })
    .split("\n")
    .filter(Boolean);

/** Whether git has the full history (Vercel and CI clones can be shallow). */
const hasFullHistory = (() => {
  try {
    return (
      execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
        cwd: REPO_ROOT,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() === "false"
    );
  } catch {
    return false;
  }
})();

/**
 * When a record file was first committed and last changed, for the record's
 * JSON-LD. Null without full git history: a shallow clone would date every
 * record to its oldest fetched commit.
 */
const recordDatesFor = (relativePaths) => {
  if (!hasFullHistory) {
    return null;
  }
  try {
    const [created] = relativePaths.flatMap(gitAddedDates).toSorted();
    const modified = execFileSync("git", ["log", "-1", "--format=%cI", "--", relativePaths[0]], {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    // Uncommitted records (local edits) have no history yet.
    return created && modified ? { created, modified } : null;
  } catch {
    return null;
  }
};

/**
 * When a profile was first added, used for the "recently added" sort and
 * sitemap lastModified. Prefers the git commit that introduced the file (stable
 * across clones), following renames, including slug renames recorded in
 * data/authority/changes.yaml whose edits git can't match as renames; falls
 * back to filesystem mtime, then build time.
 */
const addedAtFor = (file, previousSlugs = []) => {
  try {
    const dates = [
      ...gitAddedDates(`data/people/${file}`),
      // Earlier layouts and earlier slugs.
      ...previousSlugs.flatMap((slug) => [
        ...gitAddedDates(`data/people/${slug}.yaml`),
        ...gitAddedDates(`data/${slug}.yaml`),
      ]),
    ].toSorted();
    if (dates.length > 0) {
      return dates[0];
    }
  } catch {
    // git unavailable (shallow clone / non-git build) — fall through
  }
  try {
    return fs.statSync(path.join(DATA_DIR, file)).mtime.toISOString();
  } catch {
    return new Date(0).toISOString();
  }
};

const snakeToCamel = (value) => {
  // YAML parses an unquoted YYYY-MM-DD as a Date; keep it as that date string.
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (Array.isArray(value)) {
    return value.map(snakeToCamel);
  }
  // Everything else YAML produces is a scalar or a plain mapping.
  if (value instanceof Object) {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [
        key.replaceAll(/_(?<letter>[a-z])/gu, (_, letter) => letter.toUpperCase()),
        snakeToCamel(v),
      ])
    );
  }
  return value;
};

/** Write JSON, skipping the write (and the turbo cache bust) when nothing changed. */
const writeIfChanged = (outPath, data) => {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  const next = crypto.createHash("sha1").update(json).digest("hex");
  const prev = fs.existsSync(outPath)
    ? crypto.createHash("sha1").update(fs.readFileSync(outPath)).digest("hex")
    : null;
  if (next !== prev) {
    fs.writeFileSync(outPath, json);
  }
};

const loadOrganizations = () => {
  const schema = JSON.parse(fs.readFileSync(ORG_SCHEMA_PATH, "utf-8"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const files = fs.existsSync(ORGS_DIR)
    ? fs
        .readdirSync(ORGS_DIR)
        .filter((f) => f.endsWith(".yaml"))
        .toSorted()
    : [];
  const errors = [];
  const orgs = [];
  for (const file of files) {
    const raw = load(fs.readFileSync(path.join(ORGS_DIR, file), "utf-8"));
    if (!validate(raw)) {
      errors.push(
        `organizations/${file}:\n${(validate.errors ?? [])
          .map((e) => `  - ${e.instancePath || "(root)"} ${e.message}`)
          .join("\n")}`
      );
      continue;
    }
    orgs.push({
      ...snakeToCamel(raw),
      recordDates: recordDatesFor([`data/organizations/${file}`]),
    });
  }
  if (errors.length > 0) {
    console.error(`\n✖ Organization validation failed:\n\n${errors.join("\n\n")}\n`);
    process.exit(1);
  }
  return orgs.toSorted((a, b) => a.name.localeCompare(b.name));
};

/**
 * Redirects for next.config (which can't import the app's content modules):
 * permanent ids and old slugs freed by renames and merges → the current page.
 */
const authorityRedirects = (profiles, organizations, changes) => {
  const pathById = new Map([
    ...profiles.map((p) => [p.id, `/${p.slug}`]),
    ...organizations.map((o) => [o.id, `/organizations/${o.slug}`]),
  ]);
  // The live id a merged id now points to.
  const liveId = (id, depth = 0) => {
    if (pathById.has(id)) {
      return id;
    }
    const merged = changes.find((c) => c.id === id && c.action === "merged");
    return merged && depth < 5 ? liveId(merged.replacedBy, depth + 1) : null;
  };
  const resolve = (id) => pathById.get(liveId(id)) ?? null;
  // Permanent URIs: /id/<id> → current page, as real 308s (a statically
  // rendered redirect would only be a meta refresh). Withdrawn ids fall through
  // to the /id/[id] page, which explains the withdrawal.
  const idRedirects = [
    ...[...pathById].map(([id, destination]) => ({ destination, source: `/id/${id}` })),
    ...changes
      .filter((c) => c.action === "merged")
      .map((c) => ({ destination: resolve(c.id), source: `/id/${c.id}` })),
  ];
  // A merged id's JSON-LD → the surviving record's JSON-LD.
  const dataRedirects = changes
    .filter((c) => c.action === "merged" && liveId(c.id))
    .map((c) => ({ destination: `/data/${liveId(c.id)}`, source: `/data/${c.id}` }));
  const slugChanges = changes
    .filter((c) => c.action === "renamed" || c.action === "merged")
    .map((c) => ({ destination: resolve(c.id), source: `/${c.slug}` }));
  return [...idRedirects, ...dataRedirects, ...slugChanges].filter(
    (r) => r.destination && r.destination !== r.source
  );
};

/**
 * Headers for next.config: each record page advertises its JSON-LD in an HTTP
 * `Link` header, so linked-data clients find it without parsing the HTML.
 */
const authorityHeaders = (profiles, organizations) =>
  [
    ...profiles.map((p) => [p.id, `/${p.slug}`]),
    ...organizations.map((o) => [o.id, `/organizations/${o.slug}`]),
  ].map(([id, source]) => ({
    headers: [{ key: "Link", value: `</data/${id}>; rel="alternate"; type="application/ld+json"` }],
    source,
  }));

/** Slugs each id had before a rename, so its "added" date survives the rename. */
const loadPreviousSlugs = () => {
  const previousSlugs = new Map();
  for (const change of load(fs.readFileSync(CHANGES_PATH, "utf-8")) ?? []) {
    if (change.action === "renamed") {
      previousSlugs.set(change.id, [...(previousSlugs.get(change.id) ?? []), change.slug]);
    }
  }
  return previousSlugs;
};

/** Validate and normalize every profile, sorted by name; exits on invalid records. */
const loadProfiles = () => {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf-8"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .toSorted();

  const previousSlugs = loadPreviousSlugs();

  const profiles = [];
  const errors = [];

  for (const file of files) {
    const raw = load(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));

    if (!validate(raw)) {
      errors.push(
        `${file}:\n${(validate.errors ?? [])
          .map((e) => `  - ${e.instancePath || "(root)"} ${e.message}`)
          .join("\n")}`
      );
      continue;
    }

    const { slug } = raw;
    if (`${slug}.yaml` !== file && `${slug}.yml` !== file) {
      errors.push(`${file}: slug "${slug}" does not match filename`);
      continue;
    }
    const hasImage = fs.existsSync(path.join(IMAGES_DIR, `${slug}.jpg`));

    const profile = snakeToCamel(raw);
    profile.imageUrl = hasImage ? `/images/${slug}.jpg` : null;
    profile.addedAt = addedAtFor(file, previousSlugs.get(raw.id) ?? []);
    profile.recordDates = recordDatesFor([
      `data/people/${file}`,
      ...(previousSlugs.get(raw.id) ?? []).flatMap((old) => [
        `data/people/${old}.yaml`,
        `data/${old}.yaml`,
      ]),
    ]);
    profiles.push(profile);
  }

  if (errors.length > 0) {
    console.error(
      `\n✖ Content validation failed for ${errors.length} profile(s):\n\n${errors.join("\n\n")}\n`
    );
    process.exit(1);
  }

  // Stable order: alphabetical by name (the default list order).
  return profiles.toSorted((a, b) => a.name.localeCompare(b.name));
};

/** Set each organization's logoUrl and mirror the logos into public/. */
const attachLogos = (organizations) => {
  const logoFiles = [];
  for (const org of organizations) {
    const logo = logoFileFor(org.slug);
    org.logoUrl = logo ? `/logos/${logo}` : null;
    if (logo) {
      logoFiles.push(logo);
    }
  }
  syncPublicLogos(logoFiles);
};

/**
 * Denormalize organization names onto references so lists can show them
 * without loading the organization index on the client.
 */
const denormalizeOrganizations = (profiles, organizations) => {
  const orgsBySlug = new Map(organizations.map((o) => [o.slug, o]));
  for (const profile of profiles) {
    for (const ref of [...(profile.schools ?? []), ...(profile.affiliations ?? [])]) {
      const org = orgsBySlug.get(ref.organization);
      ref.organizationName = org?.name ?? ref.organization;
      if (org?.shortName) {
        ref.organizationShortName = org.shortName;
      }
      if (org?.logoUrl) {
        ref.organizationLogoUrl = org.logoUrl;
      }
      // For directory search, which runs on the client.
      if (org?.nameVariants?.length) {
        ref.organizationNameVariants = org.nameVariants;
      }
    }
  }
};

const main = () => {
  const profiles = loadProfiles();

  // Materialize the dataset images into public/ so Next.js can serve them.
  syncPublicImages(profiles.filter((p) => p.imageUrl).map((p) => p.slug));

  const organizations = loadOrganizations();
  attachLogos(organizations);
  denormalizeOrganizations(profiles, organizations);

  const changes = snakeToCamel(load(fs.readFileSync(CHANGES_PATH, "utf-8")) ?? []);

  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  writeIfChanged(OUT_PATH, profiles);
  writeIfChanged(ORGS_OUT_PATH, organizations);
  writeIfChanged(CHANGES_OUT_PATH, changes);
  writeIfChanged(SCHEMA_REFERENCE_OUT_PATH, schemaReference(organizations));
  writeIfChanged(HEADERS_OUT_PATH, authorityHeaders(profiles, organizations));
  writeIfChanged(REDIRECTS_OUT_PATH, [
    ...authorityRedirects(profiles, organizations, changes),
    ...tagRedirects(),
  ]);

  console.log(
    `✓ Generated ${profiles.length} profiles, ${organizations.length} organizations → ${path.relative(REPO_ROOT, CONTENT_DIR)}`
  );
};

main();
