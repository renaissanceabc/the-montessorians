import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { z } from "zod";

import { DATASET_ID, organizationJsonLd, personJsonLd } from "./authority";
import { datasetJsonLd, peopleJsonLd } from "./exports";
import { getAllOrganizations } from "./organizations";
import { getAllProfiles, getProfileBySlug } from "./profiles";

const URL_KEYS = new Set(["@id", "url", "sameAs", "image", "logo", "license", "contentUrl"]);
const httpUrl = z.url({ protocol: /^https?$/u });
const urlOrUrls = z.union([httpUrl, z.array(httpUrl).min(1)]);
/** A nested node that names something must say what it is. */
const typedNode = z.looseObject({ "@type": z.string(), name: z.string() });
const NODE_KEYS = new Set(["affiliation", "alumniOf", "parentOrganization", "author"]);

/** Walk the node as it is served, checking URLs, empty lists, and nested types. */
const assertWellFormed = (
  node: ReturnType<typeof personJsonLd | typeof organizationJsonLd | typeof datasetJsonLd>
) => {
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

  test("a record carries its own id, its authority ids, and its record metadata", () => {
    const maria = getProfileBySlug("maria-montessori");
    assert.ok(maria);
    const node = personJsonLd(maria);
    assert.deepEqual(node.identifier[0], {
      "@type": "PropertyValue",
      propertyID: "The Montessorians ID",
      url: node["@id"],
      value: maria.id,
    });
    assert.ok(node.identifier.some((i) => i.propertyID === "VIAF" && i.value === "99929837"));
    // The authorized heading is a SKOS label, not an alternate name.
    assert.equal(node["http://www.w3.org/2004/02/skos/core#prefLabel"], maria.nameAuthorized);
    assert.ok(!node.alternateName?.includes(maria.nameAuthorized ?? ""));
    const record = node.mainEntityOfPage;
    assert.equal(record["@type"], "ProfilePage");
    assert.equal(record.url, node.url);
    assert.deepEqual(record.isPartOf, { "@id": DATASET_ID });
    assert.equal(record.creativeWorkStatus, "Verified");
    assert.ok(
      record.citation?.some((c) => c.url === "https://id.loc.gov/authorities/names/n79064558.html")
    );
  });

  test("the bulk graph starts with the dataset it belongs to", () => {
    const dataset = datasetJsonLd();
    assertWellFormed(dataset);
    assert.equal(dataset["@id"], DATASET_ID);
    const [first] = peopleJsonLd()["@graph"];
    assert.equal(first?.["@type"], "Dataset");
    assert.ok(!("@context" in (first ?? {})));
  });
});
