# jsonb columns

Find hot-path reads of one key from a large jsonb column, and promote that key to a real column. Avoid large jsonb when you can.

Postgres stores a large jsonb value out of line (TOAST). Reading one key loads and decompresses the whole value. A key used in `WHERE` or `ORDER BY` has no plain index and no column statistics, so the planner guesses.

## Find

- SQL with `->>`, `->`, `#>>`, `@>`, or `jsonb_extract_path` in `WHERE`, `ORDER BY`, `GROUP BY`, or a join, on a hot query.
- ORM code that loads a jsonb column to read one field, such as `row.metadata.status` or `row.data.slug`. This overlaps with the columns check.
- Keys that every row has and that have a stable type. They were columns all along.

Size it before you propose anything: `select avg(pg_column_size(<col>)), max(pg_column_size(<col>)) from <table>` on a copy of production data, when one is available. Small jsonb read on a cold path is not worth a migration.

## Fix

Pick one, and say which in the pull request body:

1. A stored generated column, when the key is only derived and the app never writes it on its own:
   `alter table t add column status text generated always as (data->>'status') stored;`
   This needs no app write changes. It still rewrites the table, so plan for the lock.
2. A real column the app owns, when the key is a first-class field: add it nullable, backfill in batches, write to both places, move the reads, then add `not null` or a default, then remove the key from the jsonb.

Add an index when the column is filtered or sorted on. Move the hot reads to the new column, and select only that column.

## Going forward

A field you know about is a column. jsonb is for open-ended data that is rarely queried, such as a provider's raw payload kept for audit. Do not add a new large jsonb column without a reason in the pull request body.

## Risk

This is a migration, a risky path. Propose it to Karel (table, key, size, the queries that read it, option 1 or 2) and stop there.

## Verify

`EXPLAIN (ANALYZE, BUFFERS)` on the hot query before and after, the migration applied to a branch or local database, then typecheck and tests.
