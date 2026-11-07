# CI jobs

Review CI for short jobs that can run in parallel. GitHub Actions, Blacksmith, and similar runners bill each job rounded up to the next minute, so a 10 second job costs a full minute.

## Find

Read every file in `.github/workflows/`. For each job, note its steps and how long it takes. `gh run list --limit 5` and `gh run view <id> --json jobs` give real durations.

Look for:

- Several short jobs (lint, typecheck, format, unit tests, schema checks) that each pay for a checkout, an install, and a rounded-up minute.
- One job that runs short checks one after another, so wall-clock time is the sum of the checks.
- A matrix that fans out small work, for example one job per package when each finishes in seconds.
- An install with no cache, which every job repeats.
- No `concurrency` with `cancel-in-progress`, so a new push leaves the old run billing.

## Fix

Put short checks in one job and run them in parallel inside it. Each check prints under its own name, and the step fails if any check fails:

```yaml
- name: Checks
  shell: bash
  run: |
    set -u
    declare -A pids
    for check in lint typecheck test; do
      (bun run "$check" > "$check.log" 2>&1) &
      pids[$check]=$!
    done
    status=0
    for check in "${!pids[@]}"; do
      if wait "${pids[$check]}"; then echo "ok   $check"; else echo "FAIL $check"; status=1; fi
      echo "::group::$check"; cat "$check.log"; echo "::endgroup::"
    done
    exit $status
```

If the repo already uses a task runner that runs tasks in parallel (turbo, nx, a `run-p` script), use that instead.

- Keep a long job (build, e2e, a test suite over about a minute) as its own job, so it runs beside the merged short job.
- Cache the package install (`setup-bun`, `setup-node` cache, or `actions/cache` keyed on the lockfile).
- Add `concurrency` with `cancel-in-progress: true` on pull request workflows.
- Set `timeout-minutes` on every job.

## Leave alone

- A split that branch protection depends on. A required status check is named after the job, so merging jobs breaks it. Rename the required check in the same change, or keep the job name. Tell Karel either way.
- Jobs that need different runners, permissions, or secrets.
- A matrix across operating systems or runtime versions that tests real differences.

Workflow changes are under `.github/`, a risky path. Leave auto-merge off.

## Verify

Run `actionlint`. Compare wall-clock time and the count of billed jobs on the pull request's run against a recent run on the integration branch, and put both numbers in the body.
