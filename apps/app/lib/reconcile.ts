import { z } from "zod";

import { idUrl } from "@/lib/content/authority";
import { getAllOrganizations } from "@/lib/content/organizations";
import { getAllProfiles } from "@/lib/content/profiles";
import { siteUrl } from "@/lib/utils";

// The W3C Reconciliation Service API (v0.2) logic behind /api/reconcile, kept
// free of request handling so it can be tested directly. See docs/authority.md.

/** Most queries accepted in one batch request. OpenRefine sends 10 by default. */
export const MAX_QUERIES = 50;
/** Longest accepted query string, in characters. Names are far shorter. */
export const MAX_QUERY_LENGTH = 200;
/** Most candidates returned per query, whatever `limit` asks for. */
export const MAX_LIMIT = 25;
export const DEFAULT_LIMIT = 5;
/** Longest accepted `queries` payload (JSON text), in characters. */
export const MAX_QUERIES_PAYLOAD = 64 * 1024;

const MIN_SCORE = 55;

const propertyValue = z.union([z.string(), z.number(), z.boolean()]);

const querySchema = z.object({
  limit: z.number().optional(),
  properties: z
    .array(
      z.object({
        pid: z.string(),
        v: z.union([propertyValue, z.array(propertyValue), z.looseObject({})]).optional(),
      })
    )
    .max(20)
    .optional(),
  query: z.string().max(MAX_QUERY_LENGTH, {
    message: `must be at most ${MAX_QUERY_LENGTH} characters`,
  }),
  type: z.union([z.string(), z.array(z.string())]).optional(),
});

export type ReconQuery = z.infer<typeof querySchema>;

export interface Candidate {
  id: string;
  name: string;
  type: "Person" | "Organization";
  names: string[];
  birthYear?: number | null;
  description?: string;
}

export const TYPES = [
  { id: "Person", name: "Person" },
  { id: "Organization", name: "Organization" },
] as const;

export const manifest = () => ({
  defaultTypes: TYPES,
  documentation: `${siteUrl}/data`,
  identifierSpace: `${siteUrl}/id/`,
  name: "The Montessorians",
  schemaSpace: "http://schema.org/",
  versions: ["0.2"],
  view: { url: `${siteUrl}/id/{{id}}` },
});

const normalize = (s: string) =>
  s
    .normalize("NFKD")
    .replaceAll(/[̀-ͯ]/gu, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9 ]/gu, " ")
    .replaceAll(/\s+/gu, " ")
    .trim();

/** "Lillard, Angeline Stoll" → "Angeline Stoll Lillard" */
const uninvert = (s: string) => {
  const [last, rest] = s.split(/,(?<rest>.+)/u);
  return rest ? `${rest.replace(/,.*$/u, "")} ${last}` : s;
};

const levenshteinRatio = (a: string, b: string): number => {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    let [diag] = prev;
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length, 1);
};

export const nameScore = (query: string, name: string): number => {
  const q = normalize(uninvert(query));
  const n = normalize(uninvert(name));
  if (!(q && n)) {
    return 0;
  }
  if (q === n) {
    return 100;
  }
  const qTokens = new Set(q.split(" "));
  const nTokens = new Set(n.split(" "));
  const shared = [...qTokens].filter((t) => nTokens.has(t)).length;
  const tokenScore = (2 * shared) / (qTokens.size + nTokens.size);
  return Math.round(Math.max(tokenScore * 0.95, levenshteinRatio(q, n)) * 100);
};

let datasetCandidates: Candidate[] | null = null;

/** Every person and organization in the dataset, as reconciliation candidates. */
export const getCandidates = (): Candidate[] => {
  datasetCandidates ??= [
    ...getAllProfiles().map((p) => ({
      birthYear: p.birthYear,
      description: p.tagline ?? undefined,
      id: p.id,
      name: p.name,
      names: [p.name, p.nameAuthorized, ...p.nameVariants].filter((n): n is string => Boolean(n)),
      type: "Person" as const,
    })),
    ...getAllOrganizations().map((o) => ({
      description: o.location,
      id: o.id,
      name: o.name,
      names: [o.name, o.shortName, ...(o.nameVariants ?? [])].filter((n): n is string =>
        Boolean(n)
      ),
      type: "Organization" as const,
    })),
  ];
  return datasetCandidates;
};

const BIRTH_YEAR_PIDS = new Set(["birth_year", "birthDate"]);

export const reconcile = (q: ReconQuery, candidates: Candidate[] = getCandidates()) => {
  const wantedTypes = [q.type ?? []].flat();
  const birthYear = q.properties?.find((p) => BIRTH_YEAR_PIDS.has(p.pid))?.v;
  const limit = Math.min(Math.max(Math.trunc(q.limit ?? DEFAULT_LIMIT) || 1, 1), MAX_LIMIT);

  const scored = candidates
    .filter((c) => wantedTypes.length === 0 || wantedTypes.includes(c.type))
    .map((c) => {
      let score = Math.max(...c.names.map((n) => nameScore(q.query, n)));
      if (birthYear && c.birthYear) {
        score += String(c.birthYear) === String(birthYear).slice(0, 4) ? 5 : -15;
      }
      return { c, score: Math.max(0, Math.min(100, score)) };
    })
    .filter(({ score }) => score >= MIN_SCORE)
    .toSorted((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    result: scored.map(({ c, score }, i) => ({
      description: c.description,
      id: c.id,
      // Auto-match only a clear, unambiguous top hit.
      match: i === 0 && score >= 95 && (scored[1]?.score ?? 0) < 90,
      name: c.name,
      score,
      type: [TYPES.find((t) => t.id === c.type)],
      uri: idUrl(c.id),
    })),
  };
};

export type ReconResult = ReturnType<typeof reconcile>;

export type BatchOutcome =
  | { ok: true; results: Record<string, ReconResult> }
  | { ok: false; error: string };

const batchSchema = z
  .record(z.string(), querySchema)
  .refine((queries) => Object.keys(queries).length <= MAX_QUERIES, {
    message: `at most ${MAX_QUERIES} queries per request`,
  });

const parseJsonText = (text: string) => {
  try {
    return { json: JSON.parse(text), ok: true as const };
  } catch {
    return { ok: false as const };
  }
};

/**
 * Run a batch of queries given as the JSON text of the `queries` parameter.
 * Rejects the whole batch (rather than truncating it) when it breaks a cap,
 * so a client never silently loses rows.
 */
export const reconcileBatch = (
  queriesJson: string,
  candidates: Candidate[] = getCandidates()
): BatchOutcome => {
  if (queriesJson.length > MAX_QUERIES_PAYLOAD) {
    return { error: `queries must be at most ${MAX_QUERIES_PAYLOAD} characters`, ok: false };
  }
  const text = parseJsonText(queriesJson);
  if (!text.ok) {
    return { error: "queries must be JSON", ok: false };
  }
  const parsed = batchSchema.safeParse(text.json);
  if (!parsed.success) {
    const [issue] = parsed.error.issues;
    const where = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return { error: `${where}${issue.message}`, ok: false };
  }
  const results: Record<string, ReconResult> = {};
  for (const [key, query] of Object.entries(parsed.data)) {
    results[key] = reconcile(query, candidates);
  }
  return { ok: true, results };
};
