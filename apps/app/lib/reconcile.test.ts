import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  getCandidates,
  manifest,
  MAX_LIMIT,
  MAX_QUERIES,
  MAX_QUERY_LENGTH,
  reconcile,
  reconcileBatch,
} from "./reconcile";
import type { Candidate, ReconQuery } from "./reconcile";

const candidates: Candidate[] = [
  {
    birthYear: 1870,
    description: "Physician and educator",
    id: "tm0000001",
    name: "Maria Montessori",
    names: ["Maria Montessori", "Montessori, Maria, 1870-1952"],
    type: "Person",
  },
  {
    birthYear: 1898,
    id: "tm0000002",
    name: "Mario M. Montessori",
    names: ["Mario M. Montessori", "Montessori, Mario M."],
    type: "Person",
  },
  {
    birthYear: 1965,
    id: "tm0000003",
    name: "Maria Montessori",
    names: ["Maria Montessori"],
    type: "Person",
  },
  {
    description: "Amsterdam, Netherlands",
    id: "tm0000004",
    name: "Association Montessori Internationale",
    names: ["Association Montessori Internationale", "AMI"],
    type: "Organization",
  },
];

/** Parse a batch that is expected to succeed. */
const batch = (queries: Record<string, ReconQuery>) => {
  const outcome = reconcileBatch(JSON.stringify(queries), candidates);
  assert.equal(outcome.ok, true, outcome.ok ? "" : outcome.error);
  return outcome.ok ? outcome.results : {};
};

describe("reconciliation service", () => {
  test("manifest follows the v0.2 service shape", () => {
    const m = manifest();
    assert.deepEqual(m.versions, ["0.2"]);
    assert.equal(m.name, "The Montessorians");
    assert.ok(m.identifierSpace.endsWith("/id/"));
    assert.equal(m.schemaSpace, "http://schema.org/");
    assert.ok(m.view.url.includes("{{id}}"));
    assert.deepEqual(
      m.defaultTypes.map((t) => t.id),
      ["Person", "Organization"]
    );
  });

  test("a single query returns scored candidates with v0.2 fields", () => {
    const { result } = reconcile({ query: "Association Montessori Internationale" }, candidates);
    const [top] = result;
    assert.equal(top.id, "tm0000004");
    assert.equal(top.name, "Association Montessori Internationale");
    assert.equal(top.score, 100);
    assert.equal(top.match, true);
    assert.deepEqual(top.type, [{ id: "Organization", name: "Organization" }]);
    assert.ok(top.uri.endsWith("/id/tm0000004"));
    assert.equal(top.description, "Amsterdam, Netherlands");
  });

  test("matches inverted authorized names and name variants", () => {
    const [top] = reconcile({ query: "Montessori, Mario M." }, candidates).result;
    assert.equal(top.id, "tm0000002");
    const [ami] = reconcile({ query: "AMI" }, candidates).result;
    assert.equal(ami.id, "tm0000004");
  });

  test("does not auto-match when two candidates tie", () => {
    const { result } = reconcile({ query: "Maria Montessori" }, candidates);
    assert.equal(result[0].score, 100);
    assert.equal(result[1].score, 100);
    assert.equal(
      result.some((r) => r.match),
      false
    );
  });

  test("filters by type", () => {
    const people = reconcile({ query: "Montessori", type: "Person" }, candidates).result;
    assert.ok(people.length > 0);
    assert.ok(people.every((r) => r.type[0]?.id === "Person"));
    const orgs = reconcile(
      { query: "Association Montessori Internationale", type: ["Organization"] },
      candidates
    ).result;
    assert.deepEqual(
      orgs.map((r) => r.id),
      ["tm0000004"]
    );
    assert.deepEqual(
      reconcile({ query: "Maria Montessori", type: "Organization" }, candidates).result,
      []
    );
  });

  test("birth_year breaks a tie and enables an auto-match", () => {
    const { result } = reconcile(
      { properties: [{ pid: "birth_year", v: 1870 }], query: "Maria Montessori" },
      candidates
    );
    assert.equal(result[0].id, "tm0000001");
    assert.equal(result[0].score, 100);
    assert.equal(result[0].match, true);
    // The wrong birth year is penalised.
    const other = result.find((r) => r.id === "tm0000003");
    assert.equal(other?.score, 85);
  });

  test("birthDate strings are compared by year", () => {
    const { result } = reconcile(
      { properties: [{ pid: "birthDate", v: "1965-03-01" }], query: "Maria Montessori" },
      candidates
    );
    assert.equal(result[0].id, "tm0000003");
  });

  test("limit defaults to 5 and is capped", () => {
    const many: Candidate[] = Array.from({ length: 40 }, (_, i) => ({
      id: `tm${String(i).padStart(7, "0")}`,
      name: "Jane Doe",
      names: ["Jane Doe"],
      type: "Person" as const,
    }));
    assert.equal(reconcile({ query: "Jane Doe" }, many).result.length, 5);
    assert.equal(reconcile({ limit: 2, query: "Jane Doe" }, many).result.length, 2);
    assert.equal(reconcile({ limit: 1000, query: "Jane Doe" }, many).result.length, MAX_LIMIT);
    assert.equal(reconcile({ limit: -3, query: "Jane Doe" }, many).result.length, 1);
  });

  test("a batch answers every query under its own key", () => {
    const results = batch({
      q0: { query: "Maria Montessori", type: "Person" },
      q1: { query: "AMI", type: "Organization" },
      q2: { query: "Nobody Atall" },
    });
    assert.deepEqual(Object.keys(results), ["q0", "q1", "q2"]);
    assert.equal(results.q1.result[0].id, "tm0000004");
    assert.deepEqual(results.q2.result, []);
  });

  test("rejects malformed batches", () => {
    assert.deepEqual(reconcileBatch("{not json", candidates), {
      error: "queries must be JSON",
      ok: false,
    });
    assert.equal(reconcileBatch("[1,2]", candidates).ok, false);
    assert.equal(reconcileBatch(JSON.stringify({ q0: { limit: 3 } }), candidates).ok, false);
    assert.equal(
      reconcileBatch(JSON.stringify({ q0: { query: "x", type: 7 } }), candidates).ok,
      false
    );
  });

  test("rejects a batch with too many queries", () => {
    const queries = Object.fromEntries(
      Array.from({ length: MAX_QUERIES + 1 }, (_, i) => [`q${i}`, { query: "Maria" }])
    );
    const outcome = reconcileBatch(JSON.stringify(queries), candidates);
    assert.equal(outcome.ok, false);
    assert.match(outcome.ok ? "" : outcome.error, /at most 50 queries/u);
    const atCap = Object.fromEntries(Object.entries(queries).slice(0, MAX_QUERIES));
    assert.equal(reconcileBatch(JSON.stringify(atCap), candidates).ok, true);
  });

  test("rejects an over-long query string", () => {
    const outcome = reconcileBatch(
      JSON.stringify({ q0: { query: "a".repeat(MAX_QUERY_LENGTH + 1) } }),
      candidates
    );
    assert.equal(outcome.ok, false);
    assert.match(outcome.ok ? "" : outcome.error, /^q0\.query: /u);
  });

  test("rejects an oversized payload before parsing it", () => {
    const outcome = reconcileBatch(" ".repeat(70_000), candidates);
    assert.equal(outcome.ok, false);
  });

  test("the dataset's own records reconcile", () => {
    const dataset = getCandidates();
    const [top] = reconcile(
      { properties: [{ pid: "birth_year", v: "1870" }], query: "Montessori, Maria, 1870-1952" },
      dataset
    ).result;
    assert.equal(top.name, "Maria Montessori");
    assert.equal(top.match, true);
  });
});
