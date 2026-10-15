import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import {
  edgeColorFromStack,
  edgeSamplePoint,
  PAGE_EDGE_COLOR,
  parseCssColor,
  toHex,
} from "./safari-edges";

describe("parseCssColor", () => {
  test("reads legacy and modern rgb forms", () => {
    assert.deepEqual(parseCssColor("rgb(240, 232, 222)"), { a: 1, b: 222, g: 232, r: 240 });
    assert.deepEqual(parseCssColor("rgba(0, 0, 0, 0.07)"), { a: 0.07, b: 0, g: 0, r: 0 });
    assert.deepEqual(parseCssColor("rgb(39 82 57)"), { a: 1, b: 57, g: 82, r: 39 });
    assert.deepEqual(parseCssColor("rgb(255 255 255 / 0.95)"), { a: 0.95, b: 255, g: 255, r: 255 });
    assert.deepEqual(parseCssColor("rgb(0 0 0 / 50%)"), { a: 0.5, b: 0, g: 0, r: 0 });
    assert.deepEqual(parseCssColor("transparent"), { a: 0, b: 0, g: 0, r: 0 });
    assert.equal(
      toHex(parseCssColor("lab(31.2498 -20.6534 9.92262)") ?? { a: 0, b: 0, g: 0, r: 0 }),
      "#275239"
    );
    assert.equal(
      toHex(parseCssColor("lab(92.4226 1.54138 5.9088)") ?? { a: 0, b: 0, g: 0, r: 0 }),
      "#f0e8de"
    );
    assert.equal(
      toHex(parseCssColor("oklch(0.4 0.0645 156.36)") ?? { a: 0, b: 0, g: 0, r: 0 }),
      "#275239"
    );
    assert.equal(
      toHex(parseCssColor("oklch(40% 0.0645 156.36)") ?? { a: 0, b: 0, g: 0, r: 0 }),
      "#275239"
    );
    assert.equal(parseCssColor("color(display-p3 1 0 0)"), null);
  });
});

describe("edgeColorFromStack", () => {
  test("skips the strips and translucent chrome, then uses the first opaque layer", () => {
    const color = edgeColorFromStack([
      { backgroundColor: "rgb(240, 232, 222)", ignore: true },
      { backgroundColor: "rgba(0, 0, 0, 0.07)" },
      { backgroundColor: "rgba(255, 255, 255, 0.45)" },
      { backgroundColor: "lab(31.2498 -20.6534 9.92262)" },
    ]);
    assert.equal(color, "#275239");
  });

  test("returns null when only the document backgrounds are left", () => {
    assert.equal(
      edgeColorFromStack([
        { backgroundColor: "rgb(240, 232, 222)", ignore: true },
        { backgroundColor: "rgb(39, 82, 57)", ignore: true },
      ]),
      null
    );
  });

  test("rounds computed channels into the hex applied everywhere", () => {
    const parsed = parseCssColor("rgb(39.2, 81.6, 57.4)");
    assert.ok(parsed);
    assert.equal(toHex(parsed), "#275239");
  });
});

describe("edgeSamplePoint", () => {
  test("samples the gutter at the visible top and bottom", () => {
    assert.deepEqual(edgeSamplePoint("top", { height: 812, width: 375 }), { x: 2, y: 1 });
    assert.deepEqual(edgeSamplePoint("bottom", { height: 812, width: 375 }), { x: 2, y: 811 });
    assert.equal(edgeSamplePoint("top", { height: 0, width: 375 }), null);
  });
});

describe("PAGE_EDGE_COLOR", () => {
  test("matches the installed-app theme color", () => {
    // SAFETY: site.webmanifest is authored JSON with a string theme_color.
    const manifest = JSON.parse(
      readFileSync(new URL("../public/site.webmanifest", import.meta.url), "utf-8")
    ) as { theme_color: string };
    assert.equal(manifest.theme_color, PAGE_EDGE_COLOR);
  });
});
