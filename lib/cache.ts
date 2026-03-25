import { kvGetJson, kvGetNumber, kvIncr, kvSetJson, kvSetNumber } from "./kv";

export function coreLastRefreshKey(category: string) {
  return `core:${category}:lastRefresh`;
}

export function topicLastRefreshKey(name: string) {
  return `topic:${name}:lastRefresh`;
}

export function topicDemandScoreKey(name: string) {
  return `topic:${name}:demandScore`;
}

export function topicLastClickKey(name: string) {
  // Dormancy uses "no clicks for 7 days", so we store the timestamp here.
  // Namespace intentionally follows the required pattern: topic:{name}:...
  return `topic:${name}:lastClick`;
}

export function articleShortSummaryKey(articleId: string) {
  return `article:${articleId}:short`;
}

export function articleLongSummaryKey(articleId: string) {
  return `article:${articleId}:long`;
}

export type CachedSummary = { text: string; at: number };

export async function getCachedSummaryPair(articleId: string): Promise<{
  short_summary: string;
  long_summary: string;
  at: number;
} | null> {
  const [short, long] = await Promise.all([
    kvGetJson<CachedSummary>(articleShortSummaryKey(articleId)),
    kvGetJson<CachedSummary>(articleLongSummaryKey(articleId))
  ]);
  if (!short?.text || !long?.text) return null;
  // If timestamps differ slightly, trust the later one.
  const at = Math.max(short.at ?? 0, long.at ?? 0);
  return { short_summary: short.text, long_summary: long.text, at };
}

export async function setCachedSummaryPair(
  articleId: string,
  short_summary: string,
  long_summary: string,
  at: number
): Promise<void> {
  await Promise.all([
    kvSetJson(articleShortSummaryKey(articleId), { text: short_summary, at }),
    kvSetJson(articleLongSummaryKey(articleId), { text: long_summary, at })
  ]);
}

export async function getCoreLastRefresh(category: string): Promise<number | null> {
  return kvGetNumber(coreLastRefreshKey(category));
}

export async function setCoreLastRefresh(
  category: string,
  atMs: number
): Promise<void> {
  await kvSetNumber(coreLastRefreshKey(category), atMs);
}

export async function getTopicLastRefresh(name: string): Promise<number | null> {
  return kvGetNumber(topicLastRefreshKey(name));
}

export async function setTopicLastRefresh(name: string, atMs: number): Promise<void> {
  await kvSetNumber(topicLastRefreshKey(name), atMs);
}

export async function getTopicDemandScore(name: string): Promise<number | null> {
  return kvGetNumber(topicDemandScoreKey(name));
}

export async function setTopicDemandScore(name: string, score: number): Promise<void> {
  await kvSetNumber(topicDemandScoreKey(name), score);
}

export async function getTopicLastClick(name: string): Promise<number | null> {
  return kvGetNumber(topicLastClickKey(name));
}

export async function setTopicLastClick(name: string, atMs: number): Promise<void> {
  await kvSetNumber(topicLastClickKey(name), atMs);
}

export async function bumpTopicDemandScore(
  name: string,
  delta: number
): Promise<number> {
  const key = topicDemandScoreKey(name);
  return kvIncr(key, delta);
}

