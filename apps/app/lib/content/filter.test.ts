import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { filterAndSortProfiles } from "./filter";
import type { Profile } from "./types";

const profile = (overrides: Partial<Profile>): Profile => ({
  addedAt: "2025-01-01T00:00:00Z",
  affiliations: [],
  bio: null,
  birthYear: null,
  contributions: [],
  deathYear: null,
  education: [],
  educationNotes: null,
  glossaryCitations: [],
  id: "tm0000000",
  identifiers: {},
  imageCredit: null,
  imageUrl: null,
  kind: "alum",
  links: [],
  montessoriNotes: null,
  name: "X",
  nameAuthorized: null,
  nameVariants: [],
  notableAchievements: [],
  pinned: false,
  quotes: [],
  related: [],
  roles: [],
  schools: [],
  slug: "x",
  sources: [],
  status: "provisional",
  tagline: null,
  tags: [],
  verification: null,
  ...overrides,
  kinds: overrides.kinds ?? [overrides.kind ?? "alum"],
});

const maria = profile({
  addedAt: "2026-01-01T00:00:00Z",
  kind: "contributor",
  name: "Maria Montessori",
  pinned: true,
  roles: ["founder"],
  slug: "maria",
});
const mario = profile({
  addedAt: "2026-01-01T00:00:00Z",
  kind: "contributor",
  name: "Mario M. Montessori",
  pinned: true,
  roles: ["founder"],
  slug: "mario",
});
const lillard = profile({
  addedAt: "2026-06-01T00:00:00Z",
  affiliations: [{ organization: "university-of-virginia" }],
  contributions: [
    { title: "A", type: "book" },
    { title: "B", type: "article" },
  ],
  kind: "contributor",
  name: "Angeline Stoll Lillard",
  nameAuthorized: "Lillard, Angeline Stoll",
  roles: ["researcher"],
  slug: "lillard",
});
const alum = profile({ addedAt: "2026-09-01T00:00:00Z", name: "Yo-Yo Ma", slug: "alum" });
const all = [alum, lillard, mario, maria];

describe("filterAndSortProfiles", () => {
  test("someone who is both appears in both collections", () => {
    const both = profile({
      kind: "contributor",
      kinds: ["alum", "contributor"],
      name: "Both",
      roles: ["trainer"],
      slug: "both",
    });
    assert.deepEqual(
      filterAndSortProfiles([both], { kind: "alum" }).map((p) => p.slug),
      ["both"]
    );
    assert.deepEqual(
      filterAndSortProfiles([both], { kind: "contributor" }).map((p) => p.slug),
      ["both"]
    );
  });

  test("filters by kind", () => {
    assert.deepEqual(
      filterAndSortProfiles(all, { kind: "alum" }).map((p) => p.slug),
      ["alum"]
    );
  });

  test("lists pinned records first, alphabetically, by default", () => {
    assert.deepEqual(
      filterAndSortProfiles(all, { kind: "contributor" }).map((p) => p.slug),
      ["maria", "mario", "lillard"]
    );
  });

  test("filters contributors by role, organization, and contribution count", () => {
    assert.deepEqual(
      filterAndSortProfiles(all, { roles: "researcher" }).map((p) => p.slug),
      ["lillard"]
    );
    assert.deepEqual(
      filterAndSortProfiles(all, { organizations: "university-of-virginia" }).map((p) => p.slug),
      ["lillard"]
    );
    assert.deepEqual(
      filterAndSortProfiles(all, { minContributions: 2 }).map((p) => p.slug),
      ["lillard"]
    );
  });

  test("search matches authorized names and variants", () => {
    assert.deepEqual(
      filterAndSortProfiles(all, { search: "lillard, ang" }).map((p) => p.slug),
      ["lillard"]
    );
  });
});
