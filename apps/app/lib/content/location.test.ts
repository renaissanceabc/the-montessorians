import { describe, expect, test } from "bun:test";

import { formatLocation } from "./location";

describe("formatLocation", () => {
  test("drops a trailing United States", () => {
    expect(formatLocation("Austin, Texas, United States")).toBe("Austin, Texas");
  });

  test("leaves other countries alone", () => {
    expect(formatLocation("Rome, Italy")).toBe("Rome, Italy");
    expect(formatLocation("London, United Kingdom")).toBe("London, United Kingdom");
  });

  test("only drops the suffix at the end", () => {
    expect(formatLocation("United States")).toBe("United States");
    expect(formatLocation("United States Embassy, Paris, France")).toBe(
      "United States Embassy, Paris, France"
    );
  });
});
