---
name: verify-before-pr
description: Check the change before opening a pull request. Use when work is about to be pushed.
---

# Verify before PR

Follow "Verify your work before calling it done" in `AGENTS.md`:

1. `bun run check`, `bunx turbo run typecheck test`, and `bun run validate` when `data/` changed.
2. If a workflow file changed, run actionlint on it.
3. For anything the site renders, run the app (`cd apps/app && bun run dev:port`), then `bun run verify:ui` for the pages you touched, and exercise the change itself with `agent-browser` at 1280px and 375px. For forms, try the empty, invalid, and valid paths. A screenshot of the first paint is not the check.

Capture before and after screenshots, and a short video when the change is a flow or motion. When a later commit changes behavior, UI, or scope, capture again.

Say what you ran under How checked, including the command and the result, and what you could not check.
