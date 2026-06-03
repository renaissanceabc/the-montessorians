# Refactor The Montessorians to a fully static, file-based site

## Context

The app is a directory of 66 Montessori alumni. Today the content lives as YAML in a **separate** repo (`the-montessorians`, CC0, community-contributed) and reaches the UI through a heavy pipeline: a GitHub webhook triggers `syncYamlData()`, which fetches YAML via the GitHub API, uploads images to Vercel Blob, and upserts into Postgres (Drizzle). Pages then read Postgres through tRPC + `"use cache"`.

For a read-only directory of 66 records this is enormous overkill. The dataset is tiny (264K of YAML, 4.9M of images) and only changes when someone edits a file — i.e. at build time. Removing the database and reading the files directly makes the site faster, simpler, better for SEO, and eliminates an entire class of sync/cache-invalidation bugs.

**Decisions made with the user:**
1. **Daily featured profile** → computed **deterministically from the date** (pure `date → profile` function). No DB, no cron, no redeploy. The archive of past features is *derived*, not stored.
2. **Newsletter (Resend) + daily X post** → **dropped**. Truly static, zero backend, no crons.
3. **Repos** → **merge the app INTO the public `the-montessorians` repo** (keep its GitHub identity: stars, issues, CC0 license, contribution templates). Simplest one-commit merge — app git history is **not** preserved. `the-montessorians-app` retires. Done in this session, immediately followed by the refactor.

**Net outcome:** a static Next.js site that reads co-located YAML at build time. No Postgres, no Vercel Blob, no tRPC, no crons, no webhook, no rate limiting.

---

## Target architecture

```
the-montessorians/            (merged repo)
  data/*.yaml                 source of truth (unchanged)
  images/*.jpg                served as static assets
  apps/app/                   the Next.js site
  packages/                   (trimmed)
```

Data flow: `data/*.yaml` → build-time loader (`js-yaml`, already a dep) → in-memory array → `generateStaticParams` + Server Components → static HTML on CDN.

---

## Work plan

### 1. New build-time content layer (replaces `lib/db/`)
Create `apps/app/lib/content/profiles.ts` exposing the same shape today's `lib/db/profiles.ts` returns, so page/component changes stay minimal:
- `getAllProfiles()` — read every `data/*.yaml` (via `node:fs` + `js-yaml`), validate against the existing `ProfileSyncSchema` ([lib/schema.ts](apps/app/lib/schema.ts)), normalize keys with the existing `convertKeysToCamelCase` ([lib/utils.ts](apps/app/lib/utils.ts)). Cache the parsed array in a module-level constant (build-time, read once).
- `getProfileBySlug(slug)` + adjacent prev/next — replaces `getProfileWithAdjacentFromDB` (in-memory array index lookup instead of the `get_adjacent_profiles` SQL function).
- `getProfilesFiltered({ search, tags, orderBy, sortBy })` — in-memory `filter`/`sort` replacing the SQL in `getProfilesFromDB`. Drop pagination/cursor entirely (66 items render at once).
- Tags: derive `{ slug, label }` from each profile's `tags[]` using the existing `toTitleCase` ([lib/utils.ts](apps/app/lib/utils.ts)); compute counts in-memory. Replaces `lib/db/tags.ts`.
- **Image paths:** profiles reference `imageUrl`. Replace the Vercel-Blob URL with the static path `/images/<slug>.jpg` (served from the co-located `images/` dir, symlinked or copied into `apps/app/public/images` — see step 7). Update the two `proxyImage(...)` call sites ([profile-details.tsx:42](apps/app/app/(app)/[slug]/components/profile-details.tsx), [profile-list-item.tsx:15](apps/app/components/profile-list-item.tsx)) to use the path directly via `next/image`; delete `proxyImage` + the `/api/proxy-image` route.
- **`createdAt` / "recently added" sort:** no longer in a DB. Derive a stable date at build from git (last commit touching the file) or drop the `latest`/`trending` sort options, keeping `alphabetical`. Default: keep alphabetical + a git-derived "recently added"; confirm during impl.

### 2. Deterministic daily feature (replaces cron + `daily_feature` table)
Add `lib/content/daily.ts`:
- Sort profiles into a stable order (by slug), apply a fixed deterministic shuffle.
- `getDailyProfile(date)` = `order[daysSinceEpoch(date) % order.length]` — rotates daily, no repeat within a full 66-day cycle (better than today's 14-day rule).
- `getPastFeatures(today, n)` = map the same function over the last `n` dates → the archive, fully derived.
- Pages re-render daily without a deploy via route-segment `revalidate` (ISR) keyed to the date, **or** accept that the featured profile updates on the next deploy. Recommended: `export const revalidate = 86400` on homepage + archive so the date advances without a rebuild. (This is the one spot that isn't pure SSG; it needs no backend, only ISR.)

### 3. Convert pages to read the content layer directly
Remove tRPC from the content path; call the `lib/content` functions straight from Server Components.
- [homepage/page.tsx](apps/app/app/(app)/(homepage)/page.tsx): `getProfilesFiltered()` + `getDailyProfile(today)`.
- [[slug]/page.tsx](apps/app/app/(app)/[slug]/page.tsx) + `generateMetadata`: `getProfileBySlug`; add `generateStaticParams()` over all slugs so every profile is prerendered.
- [discover/page.tsx](apps/app/app/(app)/discover/page.tsx) + [profiles-page-wrapper.tsx](apps/app/app/(app)/discover/components/profiles-page-wrapper.tsx): pass the full profile array to the client wrapper and make filtering/search/sort **client-side, in-memory** (the wrapper already manages filter state). Remove the infinite-query/prefetch machinery and `ProfilesPaginatedList` cursor logic; render all matches.
- `tags`, `tags/[slug]` (+ `generateStaticParams`), `archive`: read from the content layer / `getPastFeatures`.
- Update [sitemap.ts](apps/app/app/sitemap.ts), `robots.ts`, `llms.txt` / `llms-full.txt` routes to enumerate from `getAllProfiles()` instead of the DB.

### 4. OG images without a backend
Today `/api/og/[slug]` reads the DB and renders at request time. Make it **statically generated**: keep the `ImageResponse` route but add `generateStaticParams()` over all slugs + `export const dynamic = "force-static"`, and read the profile + local image from `lib/content` instead of Postgres/Blob. This emits the OG PNGs as static files at build — no runtime function. (Alternative if static OG proves fiddly: a small build script writing PNGs to `public/og/`.)

### 5. Delete the backend
- tRPC: remove `subscriptions` + `tags` + `profiles` routers, `trpc/` server/client wiring, and `@tanstack/react-query` provider if nothing else needs it. Keep only if some non-content interactivity remains (none after dropping the newsletter).
- Routes: delete `api/trpc`, `api/webhooks/github`, `api/cron/update-daily-features`, `api/cron/post-daily-x`, `api/proxy-image`, `unsubscribe/` page + `subscriptions` router + email templates usage.
- `lib/data/sync.ts`, `lib/db/`, `lib/validation/email.ts`.
- `vercel.json` crons → remove the file (or empty `crons`).
- Packages: delete `packages/database` and `packages/rate-limit`; drop their usages. Review `packages/email`, `packages/observability` — `email` becomes unused (newsletter dropped); `observability`/`analytics` can stay (client analytics) but most server logging call-sites disappear.
- Env: prune `env.ts` (DATABASE_URL, BLOB_*, RESEND_*, UPSTASH_*, GITHUB_*, CRON_SECRET, UNSUBSCRIBE_SECRET, etc.). Drop `db:*` scripts from root `package.json`.

### 6. Schema reuse
Reuse the existing JSON Schema ([profile.schema.json](../the-montessorians/profile.schema.json)) and `ProfileSyncSchema` ([lib/schema.ts](apps/app/lib/schema.ts)) for build-time validation so a malformed YAML fails the build loudly rather than silently.

### 0. Branch + PR workflow
All work happens on a new branch cut from `the-montessorians`'s `main` (e.g. `refactor/static-site-merge`) — nothing lands on `main` directly. The merge (step 7) + refactor (steps 1–6) are committed to that branch and opened as a PR for review.

### 7. Repo merge — DO THIS FIRST (mechanical), then steps 1–6 run in the merged tree
Target home = the existing public `the-montessorians` repo (clean/flat: only `data/`, `images/`, `scripts/`, `profile.schema.json`, `.github/`, README, LICENSE, husky/commitlint — **no** `apps/`/`packages/`/`turbo.json`, so almost no collision). Simplest one-commit merge, app history not preserved:
- `rsync -a` the app turborepo into `the-montessorians`, **excluding** `.git`, `node_modules`, `.next`, `.turbo`, and the public-identity files to preserve: `.github/`, `README.md`, `LICENSE.md`, `package.json`, `.gitignore`, `bun.lock`.
- Reconcile by hand the overlapping root files:
  - `package.json`: use the app's turborepo root (workspaces, scripts, packageManager) and graft in the data repo's `validate` + `contributors:*` scripts and `ajv`/`js-yaml`/`prettier` devDeps; keep `name: "the-montessorians"`.
  - `.gitignore`: union of both.
  - `.github/`: keep BOTH — data repo's issue templates (contribution flow) + app workflows.
  - README/LICENSE: keep the data repo's public CC0 versions; add a short section documenting that `apps/`/`packages/` are the site (separate license) and `data/` stays CC0.
- `data/` and `images/` stay at repo root. Make images available to Next: copy/symlink `images/` → `apps/app/public/images` (or a `next.config` static mapping). Read `data/` from repo root via a path constant in the content loader (step 1).
- Commit as a single "chore: bring app into dataset repo" commit. Retire `the-montessorians-app`.
- Copy this plan into the merged repo (e.g. `docs/refactor-plan.md`) for reference.
- Point Vercel at `the-montessorians`; every push rebuilds the static site (profile PRs get preview deploys).

---

## Trade-offs captured (for the record)
- **Performance / SEO:** strictly better — all pages prerendered static HTML, no DB round-trips or cold starts.
- **Filtering:** moves to in-memory/client-side; trivial at 66 records, instant, no per-keystroke network. Cost: ships the dataset to the browser (negligible at this size).
- **Daily feature:** the only non-pure-SSG piece; handled by a deterministic function + daily ISR, needing no backend.
- **Newsletter / X automation:** removed per decision; revisit later as an isolated serverless function if ever wanted (won't need the DB).

---

## Verification
1. `bun run build` — confirm all 66 `[slug]` pages, `tags/[slug]`, and OG images are statically generated (check build output for "○ (Static)" / prerendered counts; no DB connection attempted).
2. `bun run dev` and spot-check: homepage daily profile, `/discover` search + tag filter + sort (client-side), a profile page with prev/next nav and image, `/archive`, `/tags`, `/tags/<slug>`, OG image at `/api/og/<slug>.png`, `/sitemap.xml`, `/llms.txt`.
3. Temporarily corrupt one `data/*.yaml` → build should fail with a schema error (validates step 6).
4. Change the system date (or unit-test `getDailyProfile`) to confirm the featured profile rotates deterministically and the archive matches.
5. Grep for residual `@repo/database`, `@vercel/blob`, `trpc`, `resend`, `upstash` imports → none remain in `apps/app`.
6. Lighthouse/`bun run analyze` for a before/after on bundle + SEO.
