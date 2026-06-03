import { siteUrl } from "./utils";

export const X_HANDLE = "montessoriansx";

function resolveAbsoluteUrl(input: string): string {
  if (input.startsWith("http")) {
    return input;
  }
  if (typeof window !== "undefined") {
    return new URL(input, window.location.origin).toString();
  }
  return `${siteUrl}${input.startsWith("/") ? input : `/${input}`}`;
}

export function addUtmParamsToUrl(
  rawUrl: string,
  params: { source: string; medium: string; campaign: string }
): string {
  const url = new URL(resolveAbsoluteUrl(rawUrl));
  url.searchParams.set("utm_source", params.source);
  url.searchParams.set("utm_medium", params.medium);
  url.searchParams.set("utm_campaign", params.campaign);
  return url.toString();
}

export const SHARE_CONFIG = {
  X: {
    baseUrl: "https://x.com/intent/tweet",
    buildParams: (url: string, shareText: string) =>
      new URLSearchParams({
        url,
        text: shareText,
        via: X_HANDLE,
      }).toString(),
  },
  Facebook: {
    baseUrl: "https://www.facebook.com/sharer/sharer.php",
    buildParams: (url: string) => new URLSearchParams({ u: url }).toString(),
  },
  Threads: {
    baseUrl: "https://www.threads.net/intent/post",
    buildParams: (url: string, shareText: string) =>
      new URLSearchParams({
        url,
        text: shareText,
      }).toString(),
  },
  LinkedIn: {
    baseUrl: "https://www.linkedin.com/shareArticle",
    buildParams: (url: string, shareText: string) =>
      new URLSearchParams({ url, mini: "true", title: shareText }).toString(),
  },
} as const;

export const getShareUrl = (
  platform: keyof typeof SHARE_CONFIG,
  rawUrl: string,
  text?: string
): string => {
  const config = SHARE_CONFIG[platform];
  const shareText = text ?? (typeof window !== "undefined" ? document.title : "");

  const decoratedUrl = addUtmParamsToUrl(rawUrl, {
    source: platform.toLowerCase(),
    medium: "social",
    campaign: "profile",
  });

  const params = config.buildParams(decoratedUrl, shareText);
  return `${config.baseUrl}?${params}`;
};
