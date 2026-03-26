import axios from "axios";
import type { NormalizedArticle } from "./types";
import { getRequiredEnv, parseJsonEnv } from "./utils";

/** News search strings tuned per core slug (avoids vague one-word queries like "world"). */
export const CORE_CATEGORY_SEARCH_QUERIES: Record<string, string> = {
  world: "world news",
  business: "business news",
  technology: "technology",
  health: "health",
  sports: "sports",
  entertainment: "entertainment",
  science: "science"
};


export function searchQueryForCoreCategory(category: string): string {
  return CORE_CATEGORY_SEARCH_QUERIES[category] ?? category;
}

type NewsApiKeys = {
  bing?: {
    subscriptionKey: string;
    market?: string;
    country?: string;
  };
  gnews?: {
    apiKey: string;
    lang?: string;
    country?: string;
  };
  currents?: {
    apiKey: string;
    country?: string;
    language?: string;
  };
};

function dedupeByUrl(articles: NormalizedArticle[]): NormalizedArticle[] {
  const seen = new Set<string>();
  const out: NormalizedArticle[] = [];
  for (const a of articles) {
    const key = a.url;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

function parseDateOrNull(v: unknown): string | null {
  if (!v) return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

async function fetchFromBing(query: string, limit: number) {
  const keys = parseJsonEnv<NewsApiKeys>(getRequiredEnv("NEWS_API_KEYS"), "NEWS_API_KEYS");
  const bing = keys.bing;
  if (!bing?.subscriptionKey) {
    throw new Error("Missing NEWS_API_KEYS.bing.subscriptionKey");
  }

  const resp = await axios.get("https://api.bing.microsoft.com/v7.0/news/search", {
    headers: {
      "Ocp-Apim-Subscription-Key": bing.subscriptionKey
    },
    params: {
      q: query,
      count: limit,
      mkt: bing.market ?? "en-US",
      safeSearch: "Strict"
    },
    timeout: 15_000
  });

  const value = Array.isArray(resp.data?.value) ? resp.data.value : [];
  const normalized: NormalizedArticle[] = value.map((item: any) => ({
    title: String(item?.name ?? "").trim(),
    description: item?.description ? String(item.description) : undefined,
    url: String(item?.url ?? "").trim(),
    imageUrl: item?.image?.thumbnail?.contentUrl
      ? String(item.image.thumbnail.contentUrl)
      : item?.image?.thumbnail?.url
        ? String(item.image.thumbnail.url)
        : null,
    publishedAt: parseDateOrNull(item?.datePublished),
    source: item?.provider?.[0]?.name ? String(item.provider[0].name) : null
  }));

  return normalized.filter((a) => a.title && a.url);
}

async function fetchFromGNews(query: string, limit: number) {
  const keys = parseJsonEnv<NewsApiKeys>(getRequiredEnv("NEWS_API_KEYS"), "NEWS_API_KEYS");
  const gnews = keys.gnews;
  if (!gnews?.apiKey) throw new Error("Missing NEWS_API_KEYS.gnews.apiKey");

  const resp = await axios.get("https://gnews.io/api/v4/search", {
    params: {
      q: query,
      token: gnews.apiKey,
      lang: gnews.lang ?? "en",
      country: gnews.country ?? "US",
      max: limit
    },
    timeout: 15_000
  });

  const articles = Array.isArray(resp.data?.articles) ? resp.data.articles : [];
  const normalized: NormalizedArticle[] = articles.map((item: any) => ({
    title: String(item?.title ?? "").trim(),
    description: item?.description ? String(item.description) : undefined,
    url: String(item?.url ?? "").trim(),
    imageUrl: item?.image ? String(item.image) : null,
    publishedAt: parseDateOrNull(item?.publishedAt),
    source: item?.source?.name ? String(item.source.name) : null
  }));

  return normalized.filter((a) => a.title && a.url);
}

async function fetchFromCurrents(query: string, limit: number) {
  const keys = parseJsonEnv<NewsApiKeys>(getRequiredEnv("NEWS_API_KEYS"), "NEWS_API_KEYS");
  const currents = keys.currents;
  if (!currents?.apiKey) throw new Error("Missing NEWS_API_KEYS.currents.apiKey");

  const resp = await axios.get("https://api.currentsapi.services/v1/search", {
    params: {
      apiKey: currents.apiKey,
      q: query,
      language: currents.language ?? "en",
      country: currents.country ?? "us",
      pageSize: limit
    },
    timeout: 15_000
  });

  const items = Array.isArray(resp.data?.news) ? resp.data.news : [];
  const normalized: NormalizedArticle[] = items.map((item: any) => ({
    title: String(item?.title ?? "").trim(),
    description: item?.description ? String(item.description) : undefined,
    url: String(item?.url ?? "").trim(),
    imageUrl: item?.image ? String(item.image) : null,
    publishedAt: parseDateOrNull(item?.published_at ?? item?.publishedAt),
    source: item?.source?.name ? String(item.source.name) : null
  }));

  return normalized.filter((a) => a.title && a.url);
}

export async function fetchNewsForCoreCategory(params: {
  category: string;
  limit?: number;
}): Promise<NormalizedArticle[]> {
  const { category, limit = 10 } = params;
  const query = searchQueryForCoreCategory(category);

  try {
    const bingArticles = await fetchFromBing(query, limit);
    if (bingArticles.length > 0) return dedupeByUrl(bingArticles);
  } catch (err) {
    // We'll fall back below.
  }

  const keys = parseJsonEnv<NewsApiKeys>(getRequiredEnv("NEWS_API_KEYS"), "NEWS_API_KEYS");
  if (keys.gnews) {
    const gnewsArticles = await fetchFromGNews(query, limit);
    return dedupeByUrl(gnewsArticles);
  }
  if (keys.currents) {
    const currentArticles = await fetchFromCurrents(query, limit);
    return dedupeByUrl(currentArticles);
  }

  throw new Error("No fallback provider configured in NEWS_API_KEYS");
}

export async function fetchNewsForCustomTopic(params: {
  topic: string;
  limit?: number;
}): Promise<NormalizedArticle[]> {
  const { topic, limit = 10 } = params;
  const query = topic;

  try {
    const bingArticles = await fetchFromBing(query, limit);
    if (bingArticles.length > 0) return dedupeByUrl(bingArticles);
  } catch (err) {
    // We'll fall back below.
  }

  const keys = parseJsonEnv<NewsApiKeys>(getRequiredEnv("NEWS_API_KEYS"), "NEWS_API_KEYS");
  if (keys.gnews) {
    const gnewsArticles = await fetchFromGNews(query, limit);
    return dedupeByUrl(gnewsArticles);
  }
  if (keys.currents) {
    const currentArticles = await fetchFromCurrents(query, limit);
    return dedupeByUrl(currentArticles);
  }

  throw new Error("No fallback provider configured in NEWS_API_KEYS");
}

