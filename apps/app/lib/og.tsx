import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { instrumentSerif } from "./og-font";

// Shared pieces of the Open Graph images in app/api/og: every card is 1200×630
// on the green landscape background.

export const OG_SIZE = { height: 630, width: 1200 } as const;

const PUBLIC_DIR = path.join(process.cwd(), "public");

const CONTENT_TYPES = new Map([
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

/** Read an image from the app's public/ dir and inline it as a data URL. */
export const imageFileToDataUrl = async (publicRelPath: string): Promise<string> => {
  const filePath = path.join(PUBLIC_DIR, publicRelPath.replace(/^\//u, ""));
  const buffer = await readFile(filePath);
  const contentType = CONTENT_TYPES.get(path.extname(filePath).toLowerCase()) ?? "image/jpeg";
  return `data:${contentType};base64,${buffer.toString("base64")}`;
};

/** Generated images never change for a build. */
export const OG_CACHE_CONTROL = "public, max-age=31536000, s-maxage=31536000, immutable";

/** Shrink a title so long names still fit on two lines. */
const titleSize = (title: string): number => {
  if (title.length <= 18) {
    return 104;
  }
  if (title.length <= 32) {
    return 84;
  }
  if (title.length <= 52) {
    return 68;
  }
  return 56;
};

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

export interface TextCardOptions {
  /** Small label above the title, e.g. "Organization" */
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  /** A logo shown on the right, as a data URL */
  logoDataUrl?: string | null;
}

/**
 * A text card: eyebrow, title, and subtitle over the brand background, with
 * an optional logo on the right. Used for organizations, tags, and
 * people without a photo.
 */
export const textCardResponse = async ({
  eyebrow,
  title,
  subtitle,
  logoDataUrl,
}: TextCardOptions): Promise<ImageResponse> => {
  const background = await imageFileToDataUrl("og-dynamic.jpg");
  const textRight = logoDataUrl ? 480 : 80;
  const response = new ImageResponse(
    <div
      style={{
        backgroundImage: `url(${background})`,
        backgroundPosition: "left",
        backgroundSize: "cover",
        display: "flex",
        height: "630px",
        position: "relative",
        width: "1200px",
      }}
    >
      {logoDataUrl && (
        <div
          style={{
            alignItems: "center",
            backgroundColor: "white",
            borderRadius: "48px",
            display: "flex",
            height: "340px",
            justifyContent: "center",
            overflow: "hidden",
            position: "absolute",
            right: "100px",
            top: "145px",
            width: "340px",
          }}
        >
          {/* oxlint-disable-next-line next/no-img-element -- ImageResponse (Satori) renders plain <img>; next/image can't run inside it. */}
          <img alt="" height={260} src={logoDataUrl} style={{ objectFit: "contain" }} width={260} />
        </div>
      )}
      <div
        style={{
          bottom: "80px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          left: "60px",
          position: "absolute",
          right: `${textRight}px`,
        }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: "30px",
            letterSpacing: "0.04em",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            color: "white",
            fontSize: `${titleSize(title)}px`,
            lineHeight: "0.95",
            textShadow: "0 0 10px rgba(0,0,0,0.5)",
          }}
        >
          {truncate(title, 80)}
        </div>
        {subtitle && (
          <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "36px", lineHeight: "1.2" }}>
            {truncate(subtitle, 110)}
          </div>
        )}
      </div>
    </div>,
    { ...OG_SIZE, fonts: [instrumentSerif] }
  );
  response.headers.set("Cache-Control", OG_CACHE_CONTROL);
  response.headers.set("Content-Type", "image/png");
  return response;
};
