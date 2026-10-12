import { NextResponse } from "next/server";

import { idUrl } from "@/lib/content/authority";
import { getAllOrganizations } from "@/lib/content/organizations";
import { getAllProfiles } from "@/lib/content/profiles";
import { siteUrl } from "@/lib/utils";

/**
 * GET|POST /api/reconcile
 *
 * A W3C Reconciliation Service API (v0.2) endpoint, so catalogers
 * can match their own name lists against The Montessorians in OpenRefine or
 * any other reconciliation client. See docs/authority.md.
 */

interface ReconQuery {
  query: string;
  type?: string | string[];
  limit?: number;
  properties?: { pid: string; v: unknown }[];
}

interface Candidate {
  id: string;
  name: string;
  type: "Person" | "Organization";
  names: string[];
  birthYear?: number | null;
  description?: string;
}

const TYPES = [
  { id: "Person", name: "Person" },
  { id: "Organization", name: "Organization" },
];

const CORS = { "Access-Control-Allow-Origin": "*" };

const manifest = () => ({
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

/** "Lillard, Angeline Stoll" → "angeline stoll lillard" */
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

const nameScore = (query: string, name: string): number => {
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

let candidates: Candidate[] | null = null;
const getCandidates = (): Candidate[] => {
  candidates ??= [
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
      names: [o.name, ...(o.nameVariants ?? [])],
      type: "Organization" as const,
    })),
  ];
  return candidates;
};

const reconcile = (q: ReconQuery) => {
  const wantedTypes = [q.type ?? []].flat();
  const birthYear = q.properties?.find((p) => ["birth_year", "birthDate"].includes(p.pid))?.v;
  const limit = Math.min(Math.max(q.limit ?? 5, 1), 25);

  const scored = getCandidates()
    .filter((c) => wantedTypes.length === 0 || wantedTypes.includes(c.type))
    .map((c) => {
      let score = Math.max(...c.names.map((n) => nameScore(q.query ?? "", n)));
      if (birthYear && c.birthYear) {
        score += String(c.birthYear) === String(birthYear).slice(0, 4) ? 5 : -15;
      }
      return { c, score: Math.max(0, Math.min(100, score)) };
    })
    .filter(({ score }) => score >= 55)
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

type ReconResponse = ReturnType<typeof manifest> | Record<string, ReturnType<typeof reconcile>>;

/** Responds with JSON, or JSONP when a valid `jsonpCallback` name is given. */
const respond = (body: ReconResponse, jsonpCallback: string | null) => {
  if (jsonpCallback && /^[A-Za-z_$][\w$.]*$/u.test(jsonpCallback)) {
    return new Response(`${jsonpCallback}(${JSON.stringify(body)})`, {
      headers: { "Content-Type": "application/javascript", ...CORS },
    });
  }
  return NextResponse.json(body, { headers: CORS });
};

const handle = (queriesParam: string | null, jsonpCallback: string | null) => {
  if (!queriesParam) {
    return respond(manifest(), jsonpCallback);
  }
  let queries: Record<string, ReconQuery>;
  try {
    queries = JSON.parse(queriesParam);
  } catch {
    return NextResponse.json({ error: "queries must be JSON" }, { headers: CORS, status: 400 });
  }
  const entries = Object.entries(queries).slice(0, 100);
  return respond(Object.fromEntries(entries.map(([key, q]) => [key, reconcile(q)])), jsonpCallback);
};

export const GET = (request: Request) => {
  const { searchParams } = new URL(request.url);
  return handle(searchParams.get("queries"), searchParams.get("callback"));
};

export const POST = async (request: Request) => {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    return handle(body?.queries ? JSON.stringify(body.queries) : null, null);
  }
  const form = await request.formData().catch(() => null);
  const queries = form?.get("queries");
  // A file uploaded as "queries" is ignored; only a text field is read.
  return handle(queries instanceof Blob ? null : (queries ?? null), null);
};

export const OPTIONS = () =>
  new Response(null, {
    headers: {
      ...CORS,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
