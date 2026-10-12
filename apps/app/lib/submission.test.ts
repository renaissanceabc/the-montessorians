import assert from "node:assert/strict";
import { describe, test } from "node:test";
import yaml from "js-yaml";
import { submissionSchema, submissionToYaml, yamlToSubmission } from "./submission";

const alum = {
  kind: "alum",
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
    assert.equal(submissionSchema.safeParse({ ...alum, kind: "contributor" }).success, false);
    assert.equal(
      submissionSchema.safeParse({ ...alum, kind: "contributor", roles: ["author"] }).success,
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
});
