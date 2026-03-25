import type { ClientFeedResponse } from "./clientTypes";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function getMixedFeed() {
  return fetchJson<ClientFeedResponse>("/api/feed/mixed");
}

export async function getCoreFeed(category: string) {
  return fetchJson<{ category: string; articles: ClientFeedResponse["articles"] }>(
    `/api/feed/core/${encodeURIComponent(category)}`
  );
}

export async function getCustomFeed(topic: string) {
  return fetchJson<{ topic: string; articles: ClientFeedResponse["articles"] }>(
    `/api/feed/custom/${encodeURIComponent(topic)}`
  );
}

export async function clickTopic(topic: string) {
  return fetchJson<{ demandScore: number }>(
    `/api/topic/${encodeURIComponent(topic)}/click`,
    { method: "POST" }
  );
}

