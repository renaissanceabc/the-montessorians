import { createPrivateKey, createSign } from "node:crypto";

/**
 * Authenticates as the contribute form's GitHub App installation.
 *
 * The app signs a short JWT with its private key and trades it for an
 * installation token that GitHub expires after an hour, so no long-lived
 * token exists anywhere. Tokens are cached per instance until shortly before
 * they expire.
 */

export interface GitHubAppConfig {
  appId: string;
  installationId: string;
  privateKey: string;
}

/** GitHub rejects a JWT that lives longer than 10 minutes. */
const JWT_LIFETIME_S = 9 * 60;
/** Backdated to allow for clock drift between us and GitHub. */
const JWT_BACKDATE_S = 60;
/** Refresh this long before GitHub's expiry so a request never carries a dead token. */
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

const ESCAPED_NEWLINE = /\\n/gu;

const base64url = (input: Buffer | string): string => Buffer.from(input).toString("base64url");

/** Env values often arrive with the PEM's newlines escaped as `\n`. */
const normalizePem = (pem: string): string => pem.replace(ESCAPED_NEWLINE, "\n").trim();

/** RS256 JWT with the app's client ID (or numeric app ID) as issuer. */
export const createAppJwt = (appId: string, privateKey: string, nowMs = Date.now()): string => {
  const now = Math.floor(nowMs / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({ exp: now + JWT_LIFETIME_S, iat: now - JWT_BACKDATE_S, iss: appId })
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const signature = base64url(signer.sign(createPrivateKey(normalizePem(privateKey))));
  return `${header}.${payload}.${signature}`;
};

/** Reads the three env vars; null when any is missing, so callers can fall back. */
export const gitHubAppConfig = (): GitHubAppConfig | null => {
  // Literal process.env reads, so `varlock audit` can match them to the schema.
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!(appId && installationId && privateKey)) {
    return null;
  }
  return { appId, installationId, privateKey };
};

let cached: { expiresAt: number; token: string } | null = null;

/** Test-only: forget the cached token. */
export const resetInstallationTokenCache = () => {
  cached = null;
};

/** A valid installation token, reusing the cached one while it has time left. */
export const getInstallationToken = async (
  config: GitHubAppConfig,
  fetchImpl: (url: string, init: RequestInit) => Promise<Response> = fetch,
  nowMs = Date.now()
): Promise<string> => {
  if (cached && cached.expiresAt - TOKEN_REFRESH_MARGIN_MS > nowMs) {
    return cached.token;
  }

  const jwt = createAppJwt(config.appId, config.privateKey, nowMs);
  const response = await fetchImpl(
    `https://api.github.com/app/installations/${config.installationId}/access_tokens`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${jwt}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      method: "POST",
    }
  );
  if (!response.ok) {
    throw new Error(`GitHub App token request failed with status ${response.status}`);
  }

  // SAFETY: a 2xx from the access_tokens endpoint returns token and expires_at.
  const data = (await response.json()) as { expires_at: string; token: string };
  cached = { expiresAt: Date.parse(data.expires_at), token: data.token };
  return data.token;
};
