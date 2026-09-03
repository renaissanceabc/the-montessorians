import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { normalizeOgSlug } from "./og-slug";

describe("normalizeOgSlug", () => {
  test("strips image extensions used by crawlers and metadata", () => {
    assert.equal(normalizeOgSlug("stephen-curry.png"), "stephen-curry");
    assert.equal(normalizeOgSlug("yo-yo-ma.PNG"), "yo-yo-ma");
    assert.equal(normalizeOgSlug("taylor-swift.jpg"), "taylor-swift");
    assert.equal(normalizeOgSlug("sergey-brin.jpeg"), "sergey-brin");
    assert.equal(normalizeOgSlug("steve-case.webp"), "steve-case");
    assert.equal(normalizeOgSlug("missing-profile.gif"), "missing-profile");
  });

  test("leaves bare slugs and non-image suffixes unchanged", () => {
    assert.equal(normalizeOgSlug("stephen-curry"), "stephen-curry");
    assert.equal(normalizeOgSlug("yo-yo-ma"), "yo-yo-ma");
    assert.equal(normalizeOgSlug("someone.html"), "someone.html");
    assert.equal(normalizeOgSlug("file.png.bak"), "file.png.bak");
  });
});
