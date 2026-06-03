import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const WWW_REGEX = /^www\./;
const TRAILING_SLASH_REGEX = /\/$/;
const URL_CLEANUP_REGEX = /^(https?:\/\/)?/;
const URL_SPLIT_REGEX = /[/?#]/;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ??
  "http://localhost:3010";

// For API calls, always use relative URLs to avoid cross-domain issues
export const baseUrl = "";

const ACRONYMS = ["TV", "AI", "NASA", "NBA", "NHL", "NCAA", "NFL", "MLB", "MIT", "STEM"];

export function toTitleCase(str: string) {
  const titled = str.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  return ACRONYMS.reduce((result, acronym) => {
    const regex = new RegExp(`\\b${acronym[0]}${acronym.slice(1).toLowerCase()}\\b`, "g");
    return result.replace(regex, acronym);
  }, titled);
}

export function prettyUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.replace(WWW_REGEX, "");
    const pathname = url.pathname.replace(TRAILING_SLASH_REGEX, "");
    return `${hostname}${pathname}`;
  } catch {
    return rawUrl.replace(URL_CLEANUP_REGEX, "").replace(WWW_REGEX, "").split(URL_SPLIT_REGEX)[0];
  }
}
