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
  recordDates: null,
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

  test("sorts by date added in either direction, pinned first when newest-first, ties A–Z", () => {
    assert.deepEqual(
      filterAndSortProfiles(all, { kind: "contributor" }).map((p) => p.slug),
      ["maria", "mario", "lillard"]
    );
    assert.deepEqual(
      filterAndSortProfiles(all, { kind: "contributor", limit: 1 }).map((p) => p.slug),
      ["maria"]
    );
    assert.deepEqual(
      filterAndSortProfiles(all, { kind: "contributor", sortBy: "asc" }).map((p) => p.slug),
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
    const variant = profile({ name: "Yo-Yo Ma", nameVariants: ["马友友"], slug: "variant" });
    assert.deepEqual(
      filterAndSortProfiles([variant], { search: "马友友" }).map((p) => p.slug),
      ["variant"]
    );
  });

  test("search ignores case and accents", () => {
    const jose = profile({ name: "José Ortega", slug: "jose" });
    assert.deepEqual(
      filterAndSortProfiles([jose, alum], { search: "JOSE" }).map((p) => p.slug),
      ["jose"]
    );
  });

  test("search matches taglines and tag labels", () => {
    const cellist = profile({
      name: "Someone",
      slug: "cellist",
      tagline: "Cellist and composer",
      tags: [{ label: "Musician", slug: "musician" }],
    });
    assert.deepEqual(
      filterAndSortProfiles([cellist, alum], { search: "composer" }).map((p) => p.slug),
      ["cellist"]
    );
    assert.deepEqual(
      filterAndSortProfiles([cellist, alum], { search: "musician" }).map((p) => p.slug),
      ["cellist"]
    );
  });

  test("search matches organization names, short names, and name variants", () => {
    const student = profile({
      name: "Student",
      schools: [
        {
          organization: "association-montessori-internationale",
          organizationName: "Association Montessori Internationale",
          organizationNameVariants: ["Internationale Montessori Vereniging"],
          organizationShortName: "AMI",
        },
      ],
      slug: "student",
    });
    for (const search of ["association montessori", "ami", "vereniging"]) {
      assert.deepEqual(
        filterAndSortProfiles([student, alum], { search }).map((p) => p.slug),
        ["student"],
        search
      );
    }
  });

  test("name matches rank ahead of other matches, keeping the sort within each group", () => {
    const taggedOld = profile({
      addedAt: "2020-01-01T00:00:00Z",
      name: "Ada Teacher",
      slug: "tagged-old",
      tags: [{ label: "Lillard method", slug: "lillard-method" }],
    });
    const taggedNew = profile({
      addedAt: "2027-01-01T00:00:00Z",
      name: "Bea Teacher",
      slug: "tagged-new",
      tagline: "Studied with Lillard",
    });
    assert.deepEqual(
      filterAndSortProfiles([taggedOld, taggedNew, lillard], { search: "lillard" }).map(
        (p) => p.slug
      ),
      ["lillard", "tagged-new", "tagged-old"]
    );
    assert.deepEqual(
      filterAndSortProfiles([taggedOld, taggedNew, lillard], {
        orderBy: "alphabetical",
        search: "lillard",
        sortBy: "asc",
      }).map((p) => p.slug),
      ["lillard", "tagged-old", "tagged-new"]
    );
  });
});
