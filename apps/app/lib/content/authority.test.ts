import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { z } from "zod";

import { organizationJsonLd, personJsonLd } from "./authority";
import { getAllOrganizations } from "./organizations";
import { getAllProfiles, getProfileBySlug } from "./profiles";

const URL_KEYS = new Set(["@id", "url", "sameAs", "image", "logo", "mainEntityOfPage"]);
const httpUrl = z.url({ protocol: /^https?$/u });
const urlOrUrls = z.union([httpUrl, z.array(httpUrl).min(1)]);
/** A nested node that names something must say what it is. */
const typedNode = z.looseObject({ "@type": z.string(), name: z.string() });
const NODE_KEYS = new Set(["affiliation", "alumniOf", "parentOrganization", "author"]);

/** Walk the node as it is served, checking URLs, empty lists, and nested types. */
const assertWellFormed = (node: ReturnType<typeof personJsonLd | typeof organizationJsonLd>) => {
  JSON.stringify(node, (key: string, value: ReturnType<typeof JSON.parse>) => {
    if (value === undefined) {
      // Omitted from the served JSON.
      return value;
    }
    if (Array.isArray(value)) {
      assert.ok(value.length > 0, `${node.name}: empty list at ${key}`);
    }
    if (URL_KEYS.has(key)) {
      assert.ok(urlOrUrls.safeParse(value).success, `${node.name}: bad URL at ${key}`);
    }
    if (NODE_KEYS.has(key)) {
      for (const item of [value].flat()) {
        assert.ok(typedNode.safeParse(item).success, `${node.name}: untyped node at ${key}`);
      }
    }
    return value;
  });
};

describe("JSON-LD", () => {
  test("every person is a well-formed schema.org Person", () => {
    for (const profile of getAllProfiles()) {
      const node = personJsonLd(profile);
      assert.equal(node["@context"], "https://schema.org");
      assert.equal(node["@type"], "Person");
      assert.ok(node["@id"].endsWith(`/id/${profile.id}`));
      assert.ok(node.name);
      assert.ok(!node.alternateName?.includes(profile.name), `${profile.slug}: name repeated`);
      assertWellFormed(node);
    }
  });

  test("every organization is a well-formed schema.org Organization", () => {
    for (const org of getAllOrganizations()) {
      const node = organizationJsonLd(org);
      assert.equal(node["@context"], "https://schema.org");
      assert.match(node["@type"], /Organization|CollegeOrUniversity/u);
      assert.ok(node["@id"].endsWith(`/id/${org.id}`));
      assert.ok(node.name);
      assertWellFormed(node);
    }
  });

  test("a person's works are linked as authored, with readable roles", () => {
    const maria = getProfileBySlug("maria-montessori");
    assert.ok(maria);
    const node = personJsonLd(maria);
    assert.ok(node["@reverse"]?.author.length);
    assert.ok(node.jobTitle?.includes("Founder"));
    // Profile photos, not the generated share card.
    assert.ok(!node.image?.includes("/api/og/"));
    for (const id of node.sameAs ?? []) {
      assert.ok(!id.includes("/api/og/"));
    }
  });
});
