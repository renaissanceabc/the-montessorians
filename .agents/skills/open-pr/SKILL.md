---
name: open-pr
description: Open a pull request with this repo's body. Use when the work is ready for review.
---

# Open a PR

Target `develop`. The title is a Conventional Commit (see `git-flow`); it becomes the changelog line, so lead with what a reader of the dataset or site will notice.

Use `.github/pull_request_template.md`. Fill What changed, Why, How checked, Visual evidence, Risk, and How to revert, and tick the checklist.

When the diff changes visible UI, attach the screenshots and video from `verify-before-pr`: before and after at desktop (1280px) and phone (375px) widths, and a short video for a flow or motion. Evidence goes into the pull request body via `gh pr create/edit --attach './file.png#alt'` (gh 2.102+), not a comment and not an external link. If `gh` is too old for `--attach`, say so instead of linking. Write N/A under Visual evidence when nothing visible changed.

Keep the body current. When a later commit changes behavior, UI, or scope, update the summary, the test notes, and the evidence, so the body matches the latest head.

Risk is low, medium, or high, and it names any guarded path the diff touches: release config, `.github/`, `vercel.json`, env files, major dependency bumps, and permanent ids in `data/`.

Do not merge it.
