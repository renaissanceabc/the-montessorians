# Parallel awaits

Do a deep scan of the hot paths and run independent async calls together instead of one after another.

## Find

- Two or more `await` lines in a row where the later call does not use the earlier result.
- `for (const x of xs) { await f(x) }` over items that do not depend on each other.
- Server components and loaders that await data, then render a child that awaits more data it could have started at the same time (a waterfall).
- A helper that awaits internally when the caller could start it early and await it late.

Useful starts: `rg -n "^\s*(const|let)? ?.*= await " src`, and `rg -n "for .* of .*\) \{" -A3 src | rg await`. Read each hit. A grep is a lead, not a finding.

## Fix

```ts
// before
const user = await getUser(id);
const plan = await getPlan(id);

// after
const [user, plan] = await Promise.all([getUser(id), getPlan(id)]);
```

- Start a promise as soon as its inputs exist, and await it where the value is needed.
- Use `Promise.allSettled` when one failure must not drop the other results.
- Bound concurrency for a large or user-sized list (chunks, or the repo's limiter) so the database pool and rate limits hold.

## Leave alone

- A call that needs the earlier result, or must happen after an earlier write.
- Queries on one transaction client. They run on one connection, so they queue anyway.
- Rate-limited APIs that the code calls in sequence on purpose.
- Side effects whose order matters, such as charge then record, or delete then insert.

`Promise.all` rejects on the first error, but the other calls keep running. Check that a half-finished set of writes is safe.

## Verify

Typecheck and tests. Where a route is easy to hit, time it before and after, or compare spans in the repo's tracing.
