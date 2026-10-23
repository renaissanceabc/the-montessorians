/**
 * Colors for the strips Safari extends behind the status bar and bottom toolbar.
 * The page background is the default; scrolling (the green footer, an open
 * sheet) replaces it with whatever is actually at that edge.
 *
 * `site.webmanifest` `theme_color` must stay equal to `PAGE_EDGE_COLOR`.
 */

/** `--background` / oklch(0.9345 0.016 73.68), converted to sRGB. */
export const PAGE_EDGE_COLOR = "#f0e8de";

/**
 * Translucent UI (the sticky header's tint, frosted pills) should not become
 * the chrome color. Anything below this is treated as see-through.
 */
const OPAQUE_ALPHA = 0.98;

export interface StackLayer {
  readonly backgroundColor: string;
  /** Edge strips and the document backgrounds are outputs of this system. */
  readonly ignore?: boolean;
}

interface Rgba {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

const clampByte = (channel: number) => Math.min(255, Math.max(0, Math.round(channel)));

const hexByte = (channel: number) => clampByte(channel).toString(16).padStart(2, "0");

const NUMBER = String.raw`[+-]?(?:\d+(?:\.\d+)?|\.\d+)`;
const ALPHA = String.raw`\d+(?:\.\d+)?%?`;

const RGB_COLOR = new RegExp(
  String.raw`^rgba?\(\s*(?<r>${NUMBER})\s*(?:,|\s)\s*(?<g>${NUMBER})\s*(?:,|\s)\s*(?<b>${NUMBER})(?:\s*(?:,|/)\s*(?<a>${ALPHA}))?\s*\)$`,
  "u"
);

const LAB_COLOR = new RegExp(
  String.raw`^lab\(\s*(?<l>${NUMBER})\s+(?<a>${NUMBER})\s+(?<b>${NUMBER})(?:\s*/\s*(?<alpha>${ALPHA}))?\s*\)$`,
  "u"
);

const OKLCH_COLOR = new RegExp(
  String.raw`^oklch\(\s*(?<l>${NUMBER}%?)\s+(?<c>${NUMBER})\s+(?<h>${NUMBER})(?:\s*/\s*(?<alpha>${ALPHA}))?\s*\)$`,
  "u"
);

const parseAlpha = (alpha: string | undefined) => {
  if (alpha === undefined) {
    return 1;
  }
  if (alpha.endsWith("%")) {
    return Number(alpha.slice(0, -1)) / 100;
  }
  return Number(alpha);
};

const gamma = (channel: number) => {
  const value = Math.min(1, Math.max(0, channel));
  return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
};

const linearToRgba = (red: number, green: number, blue: number, alpha: number): Rgba => ({
  a: alpha,
  b: gamma(blue) * 255,
  g: gamma(green) * 255,
  r: gamma(red) * 255,
});

/** CSS `lab()` is CIE Lab, D50. Chrome serializes oklch backgrounds this way. */
const labToRgba = (lightness: number, a: number, b: number, alpha: number): Rgba => {
  const white = [0.96422, 1, 0.82521];
  const fy = (lightness + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const epsilon = 216 / 24_389;
  const kappa = 24_389 / 27;
  const fromLab = (t: number) => (t ** 3 > epsilon ? t ** 3 : (116 * t - 16) / kappa);
  const xyz50 = [fromLab(fx) * white[0], fromLab(fy) * white[1], fromLab(fz) * white[2]];
  // Bradford D50 → D65, then linear sRGB. Same matrices as CSS Color 4.
  const d65 = [
    0.955473421488075 * xyz50[0] - 0.023098454948764 * xyz50[1] + 0.063259243200634 * xyz50[2],
    -0.028369706010506 * xyz50[0] + 1.009995428209154 * xyz50[1] + 0.021041441191917 * xyz50[2],
    0.012314969536651 * xyz50[0] - 0.020507649298899 * xyz50[1] + 1.330365936608685 * xyz50[2],
  ];
  return linearToRgba(
    3.2409699419045226 * d65[0] - 1.5373831775700939 * d65[1] - 0.4986107602930034 * d65[2],
    -0.9692436362808796 * d65[0] + 1.8759675015077204 * d65[1] + 0.0415550574071756 * d65[2],
    0.0556300796969936 * d65[0] - 0.2039769588889765 * d65[1] + 1.0569715142428784 * d65[2],
    alpha
  );
};

/** CSS `oklch()` to linear sRGB. */
const oklchToRgba = (lightness: number, chroma: number, hue: number, alpha: number): Rgba => {
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const m = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const s = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l ** 3;
  const m3 = m ** 3;
  const s3 = s ** 3;
  return linearToRgba(
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
    alpha
  );
};

const channels = (groups: Record<string, string | undefined>, names: readonly string[]) => {
  const values = names.map((name) => Number(groups[name]));
  if (values.some((value) => Number.isNaN(value))) {
    return null;
  }
  return values;
};

const parseRgb = (value: string): Rgba | null => {
  const match = RGB_COLOR.exec(value);
  if (!match?.groups) {
    return null;
  }
  const parsed = channels(match.groups, ["r", "g", "b"]);
  const alpha = parseAlpha(match.groups.a);
  if (!parsed || Number.isNaN(alpha)) {
    return null;
  }
  const [r, g, b] = parsed;
  if (r === undefined || g === undefined || b === undefined) {
    return null;
  }
  return { a: alpha, b, g, r };
};

const parseLab = (value: string): Rgba | null => {
  const match = LAB_COLOR.exec(value);
  if (!match?.groups) {
    return null;
  }
  const parsed = channels(match.groups, ["l", "a", "b"]);
  const alpha = parseAlpha(match.groups.alpha);
  if (!parsed || Number.isNaN(alpha)) {
    return null;
  }
  const [l, a, b] = parsed;
  if (l === undefined || a === undefined || b === undefined) {
    return null;
  }
  return labToRgba(l, a, b, alpha);
};

const parseOklch = (value: string): Rgba | null => {
  const match = OKLCH_COLOR.exec(value);
  if (!match?.groups) {
    return null;
  }
  const parsed = channels(match.groups, ["c", "h"]);
  const alpha = parseAlpha(match.groups.alpha);
  const rawLightness = match.groups.l ?? "";
  const lightness = rawLightness.endsWith("%")
    ? Number(rawLightness.slice(0, -1)) / 100
    : Number(rawLightness);
  if (!parsed || Number.isNaN(alpha) || Number.isNaN(lightness)) {
    return null;
  }
  const [c, h] = parsed;
  if (c === undefined || h === undefined) {
    return null;
  }
  return oklchToRgba(lightness, c, h, alpha);
};

/** Parses the color forms `getComputedStyle` returns (`rgb`, `lab`, `oklch`). */
export const parseCssColor = (input: string): Rgba | null => {
  const value = input.trim().toLowerCase();
  if (value === "transparent") {
    return { a: 0, b: 0, g: 0, r: 0 };
  }
  return parseRgb(value) ?? parseLab(value) ?? parseOklch(value);
};

export const toHex = ({ r, g, b }: Rgba) => `#${hexByte(r)}${hexByte(g)}${hexByte(b)}`;

/**
 * The front-most opaque background in a top-to-bottom hit stack.
 * Returns null when every layer is translucent or ignored, so the caller can
 * keep the page color.
 */
export const edgeColorFromStack = (layers: readonly StackLayer[]): string | null => {
  for (const layer of layers) {
    if (layer.ignore) {
      continue;
    }
    const color = parseCssColor(layer.backgroundColor);
    if (!color || color.a < OPAQUE_ALPHA) {
      continue;
    }
    return toHex(color);
  }
  return null;
};

export const edgeSamplePoint = (
  edge: "top" | "bottom",
  size: { readonly height: number; readonly width: number }
): { readonly x: number; readonly y: number } | null => {
  if (size.width <= 0 || size.height <= 0) {
    return null;
  }
  // Stay in the page gutter so centered cards and floating pills are not the edge.
  const x = Math.min(2, size.width - 1);
  const y = edge === "top" ? Math.min(1, size.height - 1) : size.height - 1;
  return { x, y };
};
