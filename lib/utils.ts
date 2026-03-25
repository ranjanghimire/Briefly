import { v5 as uuidv5 } from "uuid";

export function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function parseJsonEnv<T>(envValue: string, label: string): T {
  try {
    return JSON.parse(envValue) as T;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown JSON parse error";
    throw new Error(`Invalid JSON in ${label}: ${message}`);
  }
}

export function safeNumber(n: unknown, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : fallback;
}

export function nowMs(): number {
  return Date.now();
}

// Static core categories exposed by GET /api/categories.
// Use URL-friendly slugs because these appear in /api/feed/core/[category].
export const CORE_CATEGORIES = [
  "top",
  "world",
  "business",
  "technology",
  "health",
  "sports",
  "entertainment",
  "science"
];

const TOPIC_ID_NAMESPACE = "a2a3b3e6-3d5f-4b07-bb1c-8c7fd4f6fd0c";
const ARTICLE_ID_NAMESPACE = "e6a0d6db-2b9c-4c33-9f5c-0d3c0c2e3c2a";

export function topicIdFromName(name: string): string {
  return uuidv5(`topic:${name}`, TOPIC_ID_NAMESPACE);
}

export function articleIdFromScopeAndUrl(params: {
  scopeType: "core" | "custom";
  scopeName: string;
  url: string;
}): string {
  const scope = `${params.scopeType}:${params.scopeName}`;
  return uuidv5(`${scope}:${params.url}`, ARTICLE_ID_NAMESPACE);
}

/** Prefer stored headline; for legacy rows fall back to first line of summary. */
export function feedArticleDisplayTitle(
  storedTitle: string | null | undefined,
  shortSummary: string
): string | null {
  const t = storedTitle?.trim();
  if (t) return t;
  const line = shortSummary
    .split("\n")
    .map((s) => s.trim())
    .find(Boolean);
  return line || null;
}

