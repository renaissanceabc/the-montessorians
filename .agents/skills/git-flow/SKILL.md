---
name: git-flow
description: Branch, commit, and release rules for this repo. Use when creating a branch, committing, tagging, or deciding where a change lands.
---

# Git flow

Cut every branch from `develop` and open every pull request against it. `main` is production and only receives the promotion pull request (`develop` → `main`, merge commit, never squash).

Pull requests are squash-merged, so the title becomes the commit and the changelog line. Titles and commit messages are Conventional Commits with a lowercase subject: `feat`, `fix`, `perf`, `revert`, `refactor`, `docs`, `style`, `test`, `build`, `ci`, `chore`. New people or organizations are `feat:`, corrections to records are `fix:`. The `PR Title` check and the lefthook `commit-msg` hook enforce it.

Do not push tags. release-please tags `vX.Y.Z` on `develop` when its release PR merges, and `publish.yml` publishes the release once it reaches `main`. See `docs/RELEASING.md`.

Do not merge. Karel merges, and the release PR and the promotion PR are his gate.
