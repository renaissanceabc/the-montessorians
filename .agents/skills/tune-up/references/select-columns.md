# Select columns

Find every place that loads a whole row from the database to read a few fields, and select only what is used.

## Find

- Drizzle: `db.select().from(table)` with no field map, and `db.query.<table>.findFirst/findMany` with no `columns`.
- Prisma: `findUnique`, `findFirst`, `findMany` with no `select`, and an `include` that pulls a whole relation.
- Kysely: `selectAll()`.
- Supabase: `.select("*")` and `.select()`.
- Raw SQL: `SELECT *` and `table.*`.

For each hit, follow the result and list the fields the code reads. Wide columns (jsonb, long text, embeddings, blobs) make the biggest difference. So do rows passed whole to a client component, because every field is serialized to the browser.

## Fix

```ts
// before
const user = await db.query.users.findFirst({ where: eq(users.id, id) });
return user?.email;

// after
const user = await db.query.users.findFirst({ where: eq(users.id, id), columns: { email: true } });
return user?.email;
```

- Select the fields the code reads, and nothing else. Let the inferred type narrow, so the compiler finds every reader.
- For an existence check, select one column with a limit of 1, or use `exists`.
- Pass a narrow object to client components, not the row.

## Leave alone

- Code that really uses the whole row, such as an edit form or an export.
- A row returned through a public API contract. Narrowing it changes the response.
- `SELECT *` inside `EXISTS`, and `count(*)`.
- Rows from a cache whose shape other readers depend on. Change the cache and its readers together, or skip it.

## Verify

Typecheck first. A narrowed select turns every missed field into a type error. Then tests. For a hot query, compare `EXPLAIN (ANALYZE, BUFFERS)` before and after, when a database is available.
