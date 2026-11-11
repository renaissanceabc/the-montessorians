import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { createPublicKey, createVerify, generateKeyPairSync } from "node:crypto";

import {
  createAppJwt,
  getInstallationToken,
  gitHubAppConfig,
  resetInstallationTokenCache,
} from "./github-app";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
// GitHub hands out PKCS#1 PEMs ("BEGIN RSA PRIVATE KEY").
const pem = privateKey.export({ format: "pem", type: "pkcs1" }).toString();

const NOW_MS = Date.UTC(2026, 10, 11, 12, 0, 0);
const HOUR_MS = 60 * 60 * 1000;

const decode = (part: string) => JSON.parse(Buffer.from(part, "base64url").toString());

const tokenResponse = (token: string, expiresAtMs: number) =>
  Response.json({ expires_at: new Date(expiresAtMs).toISOString(), token }, { status: 201 });

const refuse = () => Promise.resolve(new Response("{}", { status: 401 }));

const config = { appId: "Iv23test", installationId: "42", privateKey: pem };

describe("createAppJwt", () => {
  it("signs an RS256 JWT GitHub accepts", () => {
    const jwt = createAppJwt("Iv23test", pem, NOW_MS);
    const [header, payload, signature] = jwt.split(".");
    expect(decode(header)).toEqual({ alg: "RS256", typ: "JWT" });

    const claims = decode(payload);
    const now = NOW_MS / 1000;
    expect(claims.iss).toBe("Iv23test");
    expect(claims.iat).toBeLessThan(now);
    expect(claims.exp - now).toBeLessThanOrEqual(600);

    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${header}.${payload}`);
    expect(
      verifier.verify(
        createPublicKey(publicKey.export({ format: "pem", type: "spki" })),
        signature,
        "base64url"
      )
    ).toBe(true);
  });

  it("accepts a PEM whose newlines arrive escaped", () => {
    const escaped = pem.replaceAll("\n", "\\n");
    expect(createAppJwt("Iv23test", escaped, NOW_MS).split(".")).toHaveLength(3);
  });
});

describe("gitHubAppConfig", () => {
  const names = ["GITHUB_APP_ID", "GITHUB_APP_INSTALLATION_ID", "GITHUB_APP_PRIVATE_KEY"] as const;
  const saved = names.map((name) => process.env[name]);

  afterEach(() => {
    // Assigning undefined would store the string "undefined", so delete instead.
    for (const [i, name] of names.entries()) {
      const value = saved[i];
      if (value === undefined) {
        Reflect.deleteProperty(process.env, name);
      } else {
        process.env[name] = value;
      }
    }
  });

  it("is null unless all three vars are set", () => {
    process.env.GITHUB_APP_ID = "a";
    process.env.GITHUB_APP_INSTALLATION_ID = "1";
    delete process.env.GITHUB_APP_PRIVATE_KEY;
    expect(gitHubAppConfig()).toBeNull();

    process.env.GITHUB_APP_PRIVATE_KEY = "k";
    expect(gitHubAppConfig()).toEqual({ appId: "a", installationId: "1", privateKey: "k" });
  });
});

describe("getInstallationToken", () => {
  beforeEach(resetInstallationTokenCache);

  it("requests a token for the installation and caches it", async () => {
    const calls: string[] = [];
    const fetchImpl = (url: string) => {
      calls.push(url);
      return Promise.resolve(tokenResponse("ghs_one", NOW_MS + HOUR_MS));
    };

    expect(await getInstallationToken(config, fetchImpl, NOW_MS)).toBe("ghs_one");
    expect(await getInstallationToken(config, fetchImpl, NOW_MS + 10 * 60 * 1000)).toBe("ghs_one");
    expect(calls).toEqual(["https://api.github.com/app/installations/42/access_tokens"]);
  });

  it("refreshes a token close to expiry", async () => {
    let n = 0;
    const fetchImpl = () => {
      n += 1;
      return Promise.resolve(tokenResponse(`ghs_${n}`, NOW_MS + HOUR_MS));
    };

    await getInstallationToken(config, fetchImpl, NOW_MS);
    expect(await getInstallationToken(config, fetchImpl, NOW_MS + HOUR_MS - 60 * 1000)).toBe(
      "ghs_2"
    );
  });

  it("throws when GitHub refuses", async () => {
    await expect(getInstallationToken(config, refuse, NOW_MS)).rejects.toThrow("status 401");
  });
});
