import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { filterAndSortProfiles } from "./filter";
import type { Profile } from "./types";

const profile = (overrides: Partial<Profile>): Profile => ({
  id: "tm0000000",
  slug: "x",
  name: "X",
  kind: "alum",
  roles: [],
  pinned: false,
  nameAuthorized: null,
  nameVariants: [],
  birthYear: null,
  deathYear: null,
  tagline: null,
  bio: null,
  education: [],
  educationNotes: null,
  schools: [],
  montessoriNotes: null,
  affiliations: [],
  contributions: [],
  notableAchievements: [],
  quotes: [],
  sources: [],
  verification: null,
  status: "provisional",
  identifiers: {},
  glossaryCitations: [],
  imageCredit: null,
  imageUrl: null,
  tags: [],
  links: [],
  addedAt: "2025-01-01T00:00:00Z",
  ...overrides,
});

const maria = profile({
  slug: "maria",
  name: "Maria Montessori",
  kind: "contributor",
  roles: ["founder"],
  pinned: true,
  addedAt: "2026-01-01T00:00:00Z",
});
const mario = profile({
  slug: "mario",
  name: "Mario M. Montessori",
  kind: "contributor",
  roles: ["founder"],
  pinned: true,
  addedAt: "2026-01-01T00:00:00Z",
});
const lillard = profile({
  slug: "lillard",
  name: "Angeline Stoll Lillard",
  nameAuthorized: "Lillard, Angeline Stoll",
  kind: "contributor",
  roles: ["researcher"],
  affiliations: [{ organization: "university-of-virginia" }],
  contributions: [
    { title: "A", type: "book" },
    { title: "B", type: "article" },
  ],
  addedAt: "2026-06-01T00:00:00Z",
});
const alum = profile({ slug: "alum", name: "Yo-Yo Ma", addedAt: "2026-09-01T00:00:00Z" });
const all = [alum, lillard, mario, maria];

describe("filterAndSortProfiles", () => {
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
