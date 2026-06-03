export function normalizeFilters<T extends Record<string, unknown>>(
  obj: T
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined && v !== "")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, String(v)])
  );
}
