/**
 * Server-side URL for calling the internal refresh route (same deployment).
 * Prefer BRIEFLY_BASE_URL in production so server-side fetch resolves correctly.
 */
export function getInternalRefreshUrl(): string {
  const base =
    process.env.BRIEFLY_BASE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "http://localhost:3000";
  return `${base}/api/internal/refresh`;
}

export type InternalRefreshBody =
  | { category: string; topic?: undefined }
  | { topic: string; category?: undefined };

/**
 * Fire-and-forget: feed handlers must not await summarization/fetch.
 */
export function triggerInternalRefresh(body: InternalRefreshBody): void {
  const secret = process.env.INTERNAL_REFRESH_SECRET;
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  void fetch(getInternalRefreshUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("triggerInternalRefresh fetch failed:", err);
  });
}
