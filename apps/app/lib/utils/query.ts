/** Query-string filters: each value is serialized with `String()`; unset and empty values are dropped. */
export type FilterValues = Record<string, string | number | boolean | null | undefined>;

export const normalizeFilters = (obj: FilterValues): Record<string, string> =>
  Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined && v !== "")
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, String(v)])
  );
