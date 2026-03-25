import { fetchArticlePlainText } from "./articleContent";
import { fetchNewsForCoreCategory, fetchNewsForCustomTopic } from "./fetcher";
import { summarizeArticle } from "./summarizer";
import type { NormalizedArticle } from "./types";
import {
  setCachedSummaryPair,
  setCoreLastRefresh,
  setTopicDemandScore,
  setTopicLastRefresh,
  getTopicDemandScore,
  getTopicLastClick,
  getTopicLastRefresh
} from "./cache";
import { getTopicByName, upsertArticles, upsertTopic } from "./db";
import {
  applyRecencyBonusIfRecentlyRefreshed,
  decayDemandScore,
  refreshIntervalHoursForTopic
} from "./scoring";
import { articleIdFromScopeAndUrl, nowMs, topicIdFromName } from "./utils";

const CORE_ARTICLE_LIMIT = 10;
const TOPIC_ARTICLE_LIMIT = 10;
const RAW_CONTENT_STORE_MAX = 500_000;

function rawContentForStorage(plain: string): string {
  if (plain.length <= RAW_CONTENT_STORE_MAX) return plain;
  return plain.slice(0, RAW_CONTENT_STORE_MAX);
}

async function articleWithFetchedBody(
  a: NormalizedArticle
): Promise<NormalizedArticle> {
  const fromUrl = await fetchArticlePlainText(a.url);
  const fallback = [a.title, a.description].filter(Boolean).join("\n\n").trim();

  let plain = "";
  if (fromUrl && fromUrl.length >= 120) {
    plain = fromUrl;
  } else if (fallback.length >= 40) {
    plain = fallback;
  } else {
    plain = (fromUrl ?? "").trim() || fallback;
  }

  return { ...a, rawContent: plain };
}

export async function executeCoreRefresh(category: string): Promise<void> {
  const now = nowMs();
  try {
    const fetched = await fetchNewsForCoreCategory({
      category,
      limit: CORE_ARTICLE_LIMIT
    });

    const articlesToUpsert = [];
    for (const a of fetched) {
      const enriched = await articleWithFetchedBody(a);
      const { short_summary, long_summary } = await summarizeArticle({
        article: enriched
      });
      const id = articleIdFromScopeAndUrl({
        scopeType: "core",
        scopeName: category,
        url: a.url
      });
      const body = enriched.rawContent ?? "";

      articlesToUpsert.push({
        id,
        category,
        topic: null,
        title: a.title?.trim() ? a.title.trim() : null,
        raw_content: body ? rawContentForStorage(body) : null,
        short_summary,
        long_summary,
        source: a.source ?? null,
        url: a.url,
        image_url: a.imageUrl ?? null,
        published_at: a.publishedAt ? new Date(a.publishedAt) : null
      });
    }

    await upsertArticles({ articles: articlesToUpsert });
    await Promise.all(
      articlesToUpsert.map((row) =>
        setCachedSummaryPair(
          row.id,
          row.short_summary,
          row.long_summary,
          now
        )
      )
    );
    await setCoreLastRefresh(category, now);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`executeCoreRefresh failed category="${category}":`, err);
  }
}

/**
 * On each refresh: demand_score = floor(demand_score * 0.85), then recency bonus, then fetch/summarize.
 */
export async function executeTopicRefresh(topic: string): Promise<void> {
  const now = nowMs();
  try {
    const [topicRow, kvScore, lastClickAt, lastRefreshAt] = await Promise.all([
      getTopicByName(topic),
      getTopicDemandScore(topic),
      getTopicLastClick(topic),
      getTopicLastRefresh(topic)
    ]);

    const baseScore = kvScore ?? topicRow?.demand_score ?? 0;
    const afterDecay = decayDemandScore(baseScore);
    await setTopicDemandScore(topic, afterDecay);

    const bonus = applyRecencyBonusIfRecentlyRefreshed(lastRefreshAt, now);
    const scoreAfterBonus = afterDecay + bonus;
    if (bonus > 0) {
      await setTopicDemandScore(topic, scoreAfterBonus);
    }

    const intervalHours = refreshIntervalHoursForTopic({
      demandScore: scoreAfterBonus,
      lastClickAtMs: lastClickAt,
      nowMs: now
    });

    const fetched = await fetchNewsForCustomTopic({
      topic,
      limit: TOPIC_ARTICLE_LIMIT
    });

    const articlesToUpsert = [];
    for (const a of fetched) {
      const enriched = await articleWithFetchedBody(a);
      const id = articleIdFromScopeAndUrl({
        scopeType: "custom",
        scopeName: topic,
        url: a.url
      });

      const { short_summary, long_summary } = await summarizeArticle({
        article: enriched
      });
      const body = enriched.rawContent ?? "";

      articlesToUpsert.push({
        id,
        category: null,
        topic,
        title: a.title?.trim() ? a.title.trim() : null,
        raw_content: body ? rawContentForStorage(body) : null,
        short_summary,
        long_summary,
        source: a.source ?? null,
        url: a.url,
        image_url: a.imageUrl ?? null,
        published_at: a.publishedAt ? new Date(a.publishedAt) : null
      });
    }

    await upsertArticles({ articles: articlesToUpsert });
    await Promise.all(
      articlesToUpsert.map((row) =>
        setCachedSummaryPair(
          row.id,
          row.short_summary,
          row.long_summary,
          now
        )
      )
    );

    await upsertTopic({
      id: topicIdFromName(topic),
      name: topic,
      demandScore: scoreAfterBonus,
      refreshIntervalHours: intervalHours,
      lastRefreshedAt: new Date(now)
    });

    await setTopicLastRefresh(topic, now);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`executeTopicRefresh failed topic="${topic}":`, err);
  }
}
