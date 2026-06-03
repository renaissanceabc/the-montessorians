import { createHmac, randomBytes } from "node:crypto";
import { keys } from "./keys";

const X_API_BASE = "https://api.x.com";
const X_API_V2 = `${X_API_BASE}/2`;
// Media upload uses a different domain: upload.twitter.com
const X_UPLOAD_BASE = "https://upload.twitter.com/1.1";
const X_API_V1 = `${X_API_BASE}/1.1`;

export interface TweetOptions {
  mediaIds?: string[];
  text: string;
}

export interface MediaUploadOptions {
  media: Buffer | ArrayBuffer;
  mimeType?: string;
}

export class XClient {
  private apiKey: string;
  private apiSecret: string;
  private accessToken: string;
  private accessTokenSecret: string;

  constructor() {
    const env = keys();
    this.apiKey = env.X_API_KEY;
    this.apiSecret = env.X_API_SECRET;
    this.accessToken = env.X_ACCESS_TOKEN;
    this.accessTokenSecret = env.X_ACCESS_TOKEN_SECRET;
  }

  /**
   * Generate OAuth 1.0a signature
   */
  private generateOAuthSignature(
    method: string,
    url: string,
    params: Record<string, string>
  ): string {
    // Create parameter string
    const allParams: Record<string, string> = {
      oauth_consumer_key: this.apiKey,
      oauth_token: this.accessToken,
      oauth_nonce: randomBytes(16).toString("hex"),
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_signature_method: "HMAC-SHA1",
      oauth_version: "1.0",
      ...params,
    };

    // Sort parameters
    const sortedParams = Object.keys(allParams)
      .sort()
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key]!)}`)
      .join("&");

    // Create signature base string
    const signatureBase = [
      method.toUpperCase(),
      encodeURIComponent(url),
      encodeURIComponent(sortedParams),
    ].join("&");

    // Create signing key
    const signingKey = `${encodeURIComponent(this.apiSecret)}&${encodeURIComponent(this.accessTokenSecret)}`;

    // Generate signature
    const signature = createHmac("sha1", signingKey).update(signatureBase).digest("base64");

    // Add signature to params
    allParams.oauth_signature = signature;

    // Create Authorization header
    const authParams = Object.keys(allParams)
      .filter((key) => key.startsWith("oauth_"))
      .sort()
      .map((key) => `${encodeURIComponent(key)}="${encodeURIComponent(allParams[key]!)}"`)
      .join(", ");

    return `OAuth ${authParams}`;
  }

  private async getAuthHeaders(
    method: string = "GET",
    url: string = "",
    params: Record<string, string> = {}
  ): Promise<HeadersInit> {
    const authHeader = this.generateOAuthSignature(method, url, params);
    return {
      Authorization: authHeader,
      "Content-Type": "application/json",
    };
  }

  /**
   * Upload media to X API
   * @param options Media upload options
   * @returns Media ID
   */
  async uploadMedia(options: MediaUploadOptions): Promise<string> {
    const mediaData =
      options.media instanceof ArrayBuffer ? Buffer.from(options.media) : options.media;

    const mimeType = options.mimeType || "image/png";

    // Media upload uses v1.1 API
    // In Node.js 18+, FormData is available globally
    const formData = new FormData();

    // Create a Blob from the buffer (Blob is available in Node.js 18+)
    // Convert Buffer/ArrayBuffer to ArrayBuffer for Blob compatibility
    let bufferData: ArrayBuffer;
    if (mediaData instanceof Buffer) {
      // Create a new ArrayBuffer from Buffer data
      bufferData = mediaData.buffer.slice(
        mediaData.byteOffset,
        mediaData.byteOffset + mediaData.byteLength
      ) as ArrayBuffer;
    } else if (mediaData instanceof ArrayBuffer) {
      bufferData = mediaData;
    } else {
      // For TypedArray, create a new ArrayBuffer
      bufferData = mediaData.buffer.slice(
        mediaData.byteOffset,
        mediaData.byteOffset + mediaData.byteLength
      ) as ArrayBuffer;
    }
    const blob = new Blob([bufferData], { type: mimeType });
    formData.append("media", blob, "image.png");

    // Media upload endpoint uses upload.twitter.com (different domain)
    const url = `${X_UPLOAD_BASE}/media/upload.json`;
    const headers = await this.getAuthHeaders("POST", url, {});
    // Remove Content-Type for FormData (fetch will set it with boundary)
    // Convert HeadersInit to Record for proper type handling
    const headersRecord = headers as Record<string, string>;
    const mediaHeaders: HeadersInit = {
      Authorization: headersRecord.Authorization,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: mediaHeaders,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      throw new Error(
        `X API media upload failed: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    const data = (await response.json()) as { media_id_string: string };
    return data.media_id_string;
  }

  /**
   * Create a tweet
   * @param options Tweet options including text and optional media IDs
   * @returns Tweet ID
   */
  async createTweet(options: TweetOptions): Promise<string> {
    const url = `${X_API_V2}/tweets`;
    const body: {
      text: string;
      media?: { media_ids: string[] };
    } = {
      text: options.text,
    };

    if (options.mediaIds && options.mediaIds.length > 0) {
      body.media = { media_ids: options.mediaIds };
    }

    // For OAuth 1.0a, we need to include body params in signature
    // But for JSON body, we typically don't include it in OAuth params
    const headers = await this.getAuthHeaders("POST", url, {});

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get("x-rate-limit-reset");
        throw new Error(
          `X API rate limit exceeded. Reset at: ${retryAfter || "unknown"}. ${JSON.stringify(errorData)}`
        );
      }

      throw new Error(
        `X API tweet creation failed: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    const data = (await response.json()) as { data: { id: string } };
    return data.data.id;
  }

  /**
   * Create a tweet with an image
   * @param text Tweet text
   * @param imageBuffer Image buffer
   * @param mimeType Image MIME type (default: image/png)
   * @returns Tweet ID
   */
  async createTweetWithImage(
    text: string,
    imageBuffer: Buffer | ArrayBuffer,
    mimeType = "image/png"
  ): Promise<string> {
    // Upload image first
    const mediaId = await this.uploadMedia({
      media: imageBuffer,
      mimeType,
    });

    // Then create tweet with media ID
    return this.createTweet({
      text,
      mediaIds: [mediaId],
    });
  }
}
