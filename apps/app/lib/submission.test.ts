import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { load } from "js-yaml";

import {
  newOrganizations,
  submissionSchema,
  submissionToYaml,
  yamlToSubmission,
} from "./submission";
import type { YamlMap } from "./submission";

const alum = {
  kinds: ["alum"],
  name: "Jane Doe",
  sources: [{ type: "article", url: "https://example.com/jane" }],
  tagline: "Engineer and author",
  tags: ["Engineer", "author"],
};

describe("submission", () => {
  test("requires a link for published sources and a note for personal knowledge", () => {
    assert.equal(submissionSchema.safeParse(alum).success, true);
    assert.equal(
      submissionSchema.safeParse({ ...alum, sources: [{ type: "article" }] }).success,
      false
    );
    assert.equal(
      submissionSchema.safeParse({
        ...alum,
        sources: [{ note: "Classmate", type: "personal-knowledge" }],
      }).success,
      true
    );
  });

  test("contributors need a role", () => {
    assert.equal(submissionSchema.safeParse({ ...alum, kinds: ["contributor"] }).success, false);
    assert.equal(
      submissionSchema.safeParse({ ...alum, kinds: ["contributor"], roles: ["author"] }).success,
      true
    );
  });

  test("renders profile YAML with a slug and slugged tags, and parses it back", () => {
    const parsed = submissionSchema.parse(alum);
    const text = submissionToYaml(parsed);
    // SAFETY: submissionToYaml always renders a mapping of plain YAML values.
    const doc = load(text) as YamlMap;
    assert.equal(doc.slug, "jane-doe");
    assert.deepEqual(doc.tags, ["engineer", "author"]);
    assert.equal(doc.id, null);
    assert.equal(submissionSchema.safeParse(yamlToSubmission(text)).success, true);
  });

  test("someone who is both gets a kind list, and new organizations are flagged", () => {
    const parsed = submissionSchema.parse({
      ...alum,
      affiliations: [
        { name: "Example Training Center" },
        { name: "AMI", organization: "association-montessori-internationale" },
      ],
      kinds: ["alum", "contributor"],
      roles: ["trainer"],
    });
    // SAFETY: submissionToYaml always renders a mapping of plain YAML values.
    const doc = load(submissionToYaml(parsed)) as YamlMap;
    assert.deepEqual(doc.kind, ["alum", "contributor"]);
    assert.deepEqual(doc.affiliations, [
      { organization: "example-training-center" },
      { organization: "association-montessori-internationale" },
    ]);
    assert.deepEqual(newOrganizations(parsed), ["Example Training Center"]);

    // YAML mode round-trips: known slugs stay linked, unknown ones become new organizations.
    const known = new Map([["association-montessori-internationale", "AMI"]]);
    const again = submissionSchema.parse(yamlToSubmission(submissionToYaml(parsed), known));
    assert.deepEqual(newOrganizations(again), ["Example Training Center"]);
    assert.equal(again.affiliations?.[1].organization, "association-montessori-internationale");
  });
});
