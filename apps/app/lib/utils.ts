const WWW_REGEX = /^www\./u;
const TRAILING_SLASH_REGEX = /\/$/u;
const URL_CLEANUP_REGEX = /^(?:https?:\/\/)?/u;
const URL_SPLIT_REGEX = /[/?#]/u;

export { cn } from "cn";

/** Set in next.config from the Vercel, portless, or localhost URL. */
export const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

// For API calls, always use relative URLs to avoid cross-domain issues
export const baseUrl = "";

const ACRONYMS = ["TV", "AI", "NASA", "NBA", "NHL", "NCAA", "NFL", "MLB", "MIT", "STEM"];

export const toTitleCase = (str: string) => {
  let result = str.replaceAll(/[_-]/gu, " ").replaceAll(/\b\w/gu, (char) => char.toUpperCase());

  for (const acronym of ACRONYMS) {
    const regex = new RegExp(`\\b${acronym[0]}${acronym.slice(1).toLowerCase()}\\b`, "gu");
    result = result.replaceAll(regex, acronym);
  }
  return result;
};

export const prettyUrl = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.replace(WWW_REGEX, "");
    const pathname = url.pathname.replace(TRAILING_SLASH_REGEX, "");
    return `${hostname}${pathname}`;
  } catch {
    return rawUrl.replace(URL_CLEANUP_REGEX, "").replace(WWW_REGEX, "").split(URL_SPLIT_REGEX)[0];
  }
};
