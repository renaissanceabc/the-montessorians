# URL parsing

Remove `new URL()` calls that are not needed. A WHATWG URL parse is far heavier than string work, and it often runs in middleware on every request.

## Find

`rg -n "new URL\(" --glob '!**/*.test.*'`. For each hit, ask what the code reads from the result.

Common cases:

- `new URL(request.url)` to read the path or a query value, when the framework already gives a parsed URL (`request.nextUrl` in Next.js, `c.req.path` and `c.req.query()` in Hono, `url` in a SvelteKit or Remix loader).
- `new URL(path, BASE).toString()` to join a known base and a known path.
- `new URL(CONSTANT)` inside a function or a loop.
- `try { new URL(s) } catch` used only to check that a string is a URL.
- The same string parsed again in several helpers down one call chain.

## Fix

- Use the framework's parsed URL.
- Join known parts with a template string. Encode user values with `encodeURIComponent` or `URLSearchParams`.
- Hoist a constant URL to module level.
- Use `URL.canParse(s)` for a check that does not need the parts.
- Parse once at the edge and pass the `URL` object, or the fields you need, down the chain.

## Leave alone

- Parsing untrusted input for a security check: redirect targets, SSRF allowlists, origin checks, and webhook URLs. Parsing normalizes the host and the scheme. String matching does not.
- Resolving a relative URL against a base the code does not control.
- Cold paths such as config loading at startup.

## Verify

Typecheck and tests. When a hit was in middleware or a loop, say so in the pull request body.
