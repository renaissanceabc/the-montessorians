# Module-level regexes

Build every fixed regex once at module level, not inside functions and loops.

## Find

- `new RegExp(...)` whose pattern is a constant, or built only from constants. It compiles again on every call. This is the main win.
- Regex literals inside a function body or a loop on a hot path. Each evaluation allocates a new object.
- A dynamic pattern built from the same few inputs again and again.

Useful starts: `rg -n "new RegExp\("`, and `rg -n "\.(test|match|matchAll|replace|replaceAll|split|search|exec)\(/"`. Keep only hits inside a function body.

## Fix

```ts
// before
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

// after
const NON_ALNUM = /[^a-z0-9]+/g;
function slugify(s: string) {
  return s.toLowerCase().replace(NON_ALNUM, "-");
}
```

- Name the constant for what it matches, in the repo's naming style.
- For a dynamic pattern with few distinct inputs, cache it in a module-level `Map` keyed by the input.

## Watch the flags

A regex with `g` or `y` keeps `lastIndex` between calls. After hoisting, `.test()` and `.exec()` start where the last call stopped and give wrong answers. `replace`, `replaceAll`, `match`, `matchAll`, and `split` are safe. For `.test()` or `.exec()`, drop the `g` flag when it is not needed, or set `lastIndex = 0` before each use.

## Leave alone

- Patterns built from user input that changes on every call.
- Code that runs once, such as startup or a CLI argument parser.

## Verify

Tests, and a grep showing no `new RegExp` with a constant pattern is left inside a function. Check every hoisted `g` or `y` regex for `.test()` and `.exec()` callers.
