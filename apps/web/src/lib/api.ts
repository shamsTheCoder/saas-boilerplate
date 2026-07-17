import { headers } from "next/headers";
import { getAccessToken } from "@/lib/auth";

// Prefer the internal Docker/private network URL for server-to-server calls.
// Falls back to API_URL (public), then localhost for local dev.
const API_URL =
  process.env.API_INTERNAL_URL ??
  process.env.API_URL ??
  "http://localhost:3001";


interface FetchOptions extends Omit<RequestInit, "body"> {
  path: string;
  body?: unknown;
}

/**
 * A robust server-side fetch wrapper that securely forwards IP headers
 * and injects the active access token for API authorization.
 */
async function serverFetch({ path, body, ...init }: FetchOptions): Promise<Response> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  
  const accessToken = await getAccessToken();

  const reqHeaders = new Headers(init.headers);
  if (forwardedFor) reqHeaders.set("x-forwarded-for", forwardedFor);
  if (realIp) reqHeaders.set("x-real-ip", realIp);
  if (accessToken) reqHeaders.set("Authorization", `Bearer ${accessToken}`);
  
  if (body) {
    reqHeaders.set("Content-Type", "application/json");
  }

  // Abort requests that hang longer than 8 seconds to prevent Vercel/Node timeouts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);

  try {
    return await fetch(`${API_URL}/api/v1${path}`, {
      ...init,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}


export const api = {
  get: (path: string, init?: RequestInit) => serverFetch({ path, method: "GET", ...init }),
  post: (path: string, body?: unknown, init?: RequestInit) => serverFetch({ path, method: "POST", body, ...init }),
  patch: (path: string, body?: unknown, init?: RequestInit) => serverFetch({ path, method: "PATCH", body, ...init }),
  delete: (path: string, init?: RequestInit) => serverFetch({ path, method: "DELETE", ...init }),
};
