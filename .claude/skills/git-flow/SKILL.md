---
name: git-flow
description: Branch, commit, and release rules for a renaissanceabc repo. Use when creating a branch, committing, tagging, or deciding where a change lands.
---

# Git flow

Integration work goes to the repo's integration branch (`develop`, or `main` when that is the only branch). `main` is what release-please tags.

Commit titles are Conventional Commits: `feat`, `fix`, `perf`, `revert`, `refactor`, `docs`, `style`, `test`, `build`, `ci`, `chore`.

Do not push tags. release-please does that, and on devkit it also moves the `v1` tag.

Do not merge a pull request that touches `.github/` or another risky path. Karel merges those. There is no merge queue.
