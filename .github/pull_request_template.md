## What changed

<!-- e.g. "Adds Jane Doe (tm0000080)" or "Fixes the phone layout on organization pages" -->

Closes #

## Checklist

- [ ] Targets `develop`
- [ ] Title is a conventional commit (`feat:`, `fix:`, `docs:`, `chore:` …); it becomes the changelog entry
- [ ] **Data**: every claim has a source per the [editorial policy](https://themontessorians.xyz/about/editorial-policy), no `id` was changed or reused, and `bun run data:lint` passes
- [ ] **Code**: `bun run check` passes, and `bun run verify:ui` passes for the pages you changed
