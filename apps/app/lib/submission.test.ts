import assert from "node:assert/strict";
import { describe, test } from "node:test";
import yaml from "js-yaml";
import {
  newOrganizations,
  submissionSchema,
  submissionToYaml,
  yamlToSubmission,
} from "./submission";

const alum = {
  kinds: ["alum"],
  name: "Jane Doe",
  tagline: "Engineer and author",
  tags: ["Engineer", "author"],
  sources: [{ type: "article", url: "https://example.com/jane" }],
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
        sources: [{ type: "personal-knowledge", note: "Classmate" }],
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
    const doc = yaml.load(text) as Record<string, unknown>;
    assert.equal(doc.slug, "jane-doe");
    assert.deepEqual(doc.tags, ["engineer", "author"]);
    assert.equal(doc.id, null);
    assert.equal(submissionSchema.safeParse(yamlToSubmission(text)).success, true);
  });

  test("someone who is both gets a kind list, and new organizations are flagged", () => {
    const parsed = submissionSchema.parse({
      ...alum,
      kinds: ["alum", "contributor"],
      roles: ["trainer"],
      affiliations: [
        { name: "Example Training Center" },
        { organization: "association-montessori-internationale", name: "AMI" },
      ],
    });
    const doc = yaml.load(submissionToYaml(parsed)) as Record<string, unknown>;
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
