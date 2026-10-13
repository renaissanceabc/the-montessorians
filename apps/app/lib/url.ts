import { siteUrl } from "./utils";

export const X_HANDLE = "montessoriansx";

const resolveAbsoluteUrl = (input: string): string => {
  if (input.startsWith("http")) {
    return input;
  }
  if (typeof window !== "undefined") {
    return new URL(input, window.location.origin).toString();
  }
  return `${siteUrl}${input.startsWith("/") ? input : `/${input}`}`;
};

export const addUtmParamsToUrl = (
  rawUrl: string,
  params: { source: string; medium: string; campaign: string }
): string => {
  const url = new URL(resolveAbsoluteUrl(rawUrl));
  url.searchParams.set("utm_source", params.source);
  url.searchParams.set("utm_medium", params.medium);
  url.searchParams.set("utm_campaign", params.campaign);
  return url.toString();
};

export const SHARE_CONFIG = {
  Facebook: {
    baseUrl: "https://www.facebook.com/sharer/sharer.php",
    buildParams: (url: string) => new URLSearchParams({ u: url }).toString(),
  },
  LinkedIn: {
    baseUrl: "https://www.linkedin.com/shareArticle",
    buildParams: (url: string, shareText: string) =>
      // Tuples keep the parameter order (url, mini, title) in the share link.
      new URLSearchParams([
        ["url", url],
        ["mini", "true"],
        ["title", shareText],
      ]).toString(),
  },
  Threads: {
    baseUrl: "https://www.threads.net/intent/post",
    buildParams: (url: string, shareText: string) =>
      new URLSearchParams([
        ["url", url],
        ["text", shareText],
      ]).toString(),
  },
  X: {
    baseUrl: "https://x.com/intent/tweet",
    buildParams: (url: string, shareText: string) =>
      new URLSearchParams([
        ["url", url],
        ["text", shareText],
        ["via", X_HANDLE],
      ]).toString(),
  },
} as const;

export const getShareUrl = (
  platform: keyof typeof SHARE_CONFIG,
  rawUrl: string,
  text?: string
): string => {
  const config = SHARE_CONFIG[platform];
  const shareText = text ?? (typeof window === "undefined" ? "" : document.title);

  const decoratedUrl = addUtmParamsToUrl(rawUrl, {
    campaign: "profile",
    medium: "social",
    source: platform.toLowerCase(),
  });

  const params = config.buildParams(decoratedUrl, shareText);
  return `${config.baseUrl}?${params}`;
};

export const REPO_URL = "https://github.com/renaissanceabc/the-montessorians";

/** A prefilled GitHub issue from one of the issue forms in .github/ISSUE_TEMPLATE. */
export const githubIssueUrl = (
  template: string,
  fields: Record<string, string | undefined>
): string => {
  const params = new URLSearchParams({ template });
  for (const [key, value] of Object.entries(fields)) {
    if (value) {
      params.set(key, value);
    }
  }
  return `${REPO_URL}/issues/new?${params.toString()}`;
};

export const correctionUrl = (profile: { id: string; name: string }): string =>
  githubIssueUrl("04_correction.yml", {
    record: profile.id,
    title: `Correction: ${profile.name} (${profile.id})`,
  });
