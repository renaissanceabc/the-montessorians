---
name: tune-up
description: Performance habits and a checkpoint audit. Use while writing request handlers, loaders, database queries, regexes, URL handling, jsonb schema, or CI workflows, and when asked to tune up, improve, speed up, or audit performance.
---

# Tune-up

Two modes. While writing code, follow the rules below and load nothing else. At a checkpoint, run the audit, which reads one reference file per check.

## While writing code

- Independent awaits run together with `Promise.all`. Await in sequence only when a call needs the result of the one before it.
- Select the columns you read. Do not load a whole row to use two fields.
- Build a regex once at module level, not inside a function or a loop. A hoisted `g` or `y` regex keeps `lastIndex` between calls.
- Do not call `new URL()` on what is already parsed or can be joined as a string. Parse untrusted input once and pass the result along.
- A value you filter, sort, or read on a hot path is a real column, not a jsonb key. Avoid large jsonb.
- Short CI checks (lint, typecheck, unit tests) share one job and run in parallel inside it. Each job is billed rounded up to the next minute, so a 10 second job costs a full minute.

## Checkpoint

Run at a checkpoint: before a release, after a feature lands, or when Karel asks.

| Check | Reference | Looks for |
| --- | --- | --- |
| awaits | [parallel-awaits.md](references/parallel-awaits.md) | Sequential awaits on hot paths that do not depend on each other |
| ci | [ci-jobs.md](references/ci-jobs.md) | Short CI jobs that each pay a full minute, and checks that run one after another |
| columns | [select-columns.md](references/select-columns.md) | Whole rows loaded to read a few fields |
| url | [url-parsing.md](references/url-parsing.md) | Unneeded `new URL()` parsing |
| regex | [module-regex.md](references/module-regex.md) | Regexes built inside functions and loops |
| jsonb | [jsonb-columns.md](references/jsonb-columns.md) | Hot reads of one key from a large jsonb column |

### Choosing checks

- Karel named checks, for example `tune-up regex url`: run those. `tune-up all` runs every check.
- Bare `tune-up`: probe the repo with the signals below, then show Karel the table with a hit count per check and a recommended set, and ask once which to run. If nobody can answer (an automation, a cloud run), run every check that has hits, and stop jsonb at a proposal.
- `branch` anywhere in the invocation limits the scan to files changed since the integration branch, and the code that calls them.

Signals, all excluding tests, fixtures, vendored code, and generated files:

- awaits: any server code with `await`.
- ci: `.github/workflows/` has two or more jobs, or one job runs several short checks in sequence.
- columns: an ORM or SQL client (drizzle, prisma, kysely, supabase, `pg`, `postgres`) or `SELECT *`.
- url: `rg -n "new URL\("`.
- regex: `rg -n "new RegExp\("`, and regex literals inside function bodies.
- jsonb: `jsonb` in a schema or migration.

### Running a check

1. Read that check's reference file. Do not read the others.
2. Find the hot paths first: request handlers, middleware, loaders and server components, API routes, queue workers, cron loops, and anything inside a loop over user data. Scripts, migrations, tests, and one-off CLIs are low value. Skip them unless the fix is free.
3. Fix the whole class in the repo, not only the first hit. Keep behavior the same.
4. Run the repo's typecheck and tests. Measure where it is cheap, and say what you measured.
5. Each check is its own pull request, following the `open-pr` skill. Title it like `perf: hoist regexes to module level`.

This repo has no database (`data/` YAML compiles to JSON at build time), so the columns and jsonb checks usually have nothing to scan.

### Report

For each check: what changed with `file:line`, what you left alone and why, and what you did not scan. "Nothing worth changing" is a fine result. Do not pad it.
