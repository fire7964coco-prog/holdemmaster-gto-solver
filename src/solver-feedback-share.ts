import { feedbackFeatures } from "./solver-feedback-features";

const SHARE_API = "https://www.holdemmaster.com/api/spot-share";
const MAIN_ORIGIN = "https://www.holdemmaster.com";
const PAYLOAD_LIMIT = 16384; // Same limit as spot-share.ts: applySpotFromUrl.

/**
 * Main-site code 2 (MB-215): { payload } -> 200 { ok, id, url }, 4xx/5xx { ok:false, error }.
 * Encoding/decoding stays in spot-share.ts.
 * Every failure returns the exact original URL, including a 3-second timeout.
 */
export const shareSpotThroughMain = async (originalUrl: string): Promise<string> => {
  if (!feedbackFeatures.share) return originalUrl;
  let payload: string | null;
  try {
    payload = new URL(originalUrl).searchParams.get("spot");
  } catch {
    return originalUrl;
  }
  if (!payload || payload.length > PAYLOAD_LIMIT) return originalUrl;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(SHARE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({ payload }),
      signal: controller.signal,
    });
    if (!response.ok) return originalUrl;
    const result: unknown = await response.json();
    if (!result || typeof result !== "object") return originalUrl;
    const { id, url } = result as { id?: unknown; url?: unknown };
    if (typeof url === "string") {
      const parsed = new URL(url);
      if (parsed.origin === MAIN_ORIGIN && !parsed.username && !parsed.password &&
          /^\/s\/[A-Za-z0-9_-]+$/.test(parsed.pathname)) return url;
    }
    if (typeof id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(id)) {
      return `${MAIN_ORIGIN}/s/${id}`;
    }
  } catch {
    // Offline, rejected, malformed and timed-out responses must not block sharing.
  } finally {
    clearTimeout(timeout);
  }
  return originalUrl;
};
