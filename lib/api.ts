import type { ClientFeedResponse, TopicsApiResponse } from "./clientTypes";

/** Shared SWR key for home + Topics revalidation. */
export const TOPICS_SWR_KEY = "/api/topics";

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

export async function getTopicsList() {
  return fetchJson<TopicsApiResponse>(TOPICS_SWR_KEY);
}

export async function deleteTopicByName(name: string) {
  return fetchJson<{ ok: boolean }>(
    `${TOPICS_SWR_KEY}?name=${encodeURIComponent(name)}`,
    { method: "DELETE" }
  );
}

