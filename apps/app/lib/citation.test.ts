import assert from "node:assert/strict";
import { test } from "node:test";

import { formatCitation, withAccessDate } from "./citation";

test("a citation gives the heading, the id, and the permanent URI", () => {
  const citation = formatCitation({
    heading: "Montessori, Maria, 1870-1952",
    id: "tm0000067",
    permanentUrl: "https://www.themontessorians.xyz/id/tm0000067",
  });
  assert.equal(
    citation,
    "Montessori, Maria, 1870-1952. The Montessorians, tm0000067. https://www.themontessorians.xyz/id/tm0000067."
  );
  assert.equal(
    withAccessDate(citation, new Date(2026, 9, 14)),
    `${citation} Accessed 14 October 2026.`
  );
});

test("a heading that ends in a full stop doesn't get a second one", () => {
  const citation = formatCitation({ heading: "Lillard, A. S.", id: "tm1", permanentUrl: "u" });
  assert.ok(citation.startsWith("Lillard, A. S. The Montessorians"));
});
