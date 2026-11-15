<!-- Title: a conventional commit, e.g. "feat: add Jane Doe" or "fix: correct the phone layout on organization pages". It becomes the changelog line. -->

Closes #

## What changed

## Why

## How checked

<!-- Commands you ran and their results, and anything you could not check. -->

## Visual evidence

<!-- Before and after screenshots at desktop and phone widths, and a short video for a flow or motion. N/A when nothing visible changed. -->

## Risk

<!-- low / medium / high. Name any guarded path: release config, .github/, vercel.json, env files, major dependency bumps, permanent ids. -->

## How to revert

## Checklist

- [ ] Targets `develop`
- [ ] **Data**: every claim has a source per the [editorial policy](https://themontessorians.xyz/about/editorial-policy), no `id` was changed or reused, and `bun run data:lint` passes
- [ ] **Code**: `bun run check` passes, and `bun run verify:ui` passes for the pages you changed
