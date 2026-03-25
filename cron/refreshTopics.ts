import { fetchNewsForCustomTopic } from "../lib/fetcher";
import { summarizeArticle } from "../lib/summarizer";
import {
  articleIdFromScopeAndUrl,
  nowMs,
  topicIdFromName
} from "../lib/utils";
import {
  getTopicDemandScore,
  getTopicLastClick,
  getTopicLastRefresh,
  setCachedSummaryPair,
  setTopicDemandScore,
  setTopicLastRefresh
} from "../lib/cache";
import { upsertArticles, upsertTopic, getAllTopics } from "../lib/db";
import {
  applyRecencyBonusIfRecentlyRefreshed,
  refreshIntervalHoursForTopic,
  // refreshIntervalHoursFromDemandScore is not needed directly here since we
  // always use refreshIntervalHoursForTopic (which includes dormancy).
} from "../lib/scoring";

const MAX_ARTICLES_PER_TOPIC = 10;

export async function refreshTopics() {
  const now = nowMs();
  const topics = await getAllTopics();
  if (topics.length === 0) return;

  // Refresh sequentially to keep costs and API usage under control.
  for (const topic of topics) {
    const name = topic.name;
    try {
      const liveDemandScore =
        (await getTopicDemandScore(name)) ?? topic.demand_score;
      const lastClickAt = (await getTopicLastClick(name)) ?? null;
      const lastRefreshedAt =
        (await getTopicLastRefresh(name)) ??
        (topic.last_refreshed ? Date.parse(topic.last_refreshed) : null);

      const intervalHours = refreshIntervalHoursForTopic({
        demandScore: liveDemandScore,
        lastClickAtMs: lastClickAt,
        nowMs: now
      });

      const due =
        !lastRefreshedAt ||
        now - lastRefreshedAt >= intervalHours * 60 * 60 * 1000;

      if (!due) continue;

      // Apply +5 recency bonus when the previous refresh was within 24 hours.
      const bonus = applyRecencyBonusIfRecentlyRefreshed(
        lastRefreshedAt,
        now
      );
      const demandScoreAfterBonus = liveDemandScore + bonus;

      // Keep KV live score consistent for fast reads.
      await setTopicDemandScore(name, demandScoreAfterBonus);

      const fetched = await fetchNewsForCustomTopic({
        topic: name,
        limit: MAX_ARTICLES_PER_TOPIC
      });

      const articlesToUpsert = [];
      for (const a of fetched) {
        const id = articleIdFromScopeAndUrl({
          scopeType: "custom",
          scopeName: name,
          url: a.url
        });

        const { short_summary, long_summary } = await summarizeArticle({
          article: a
        });

        articlesToUpsert.push({
          id,
          category: null,
          topic: name,
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

      const finalInterval = refreshIntervalHoursForTopic({
        demandScore: demandScoreAfterBonus,
        lastClickAtMs: lastClickAt,
        nowMs: now
      });

      await upsertTopic({
        id: topicIdFromName(name),
        name,
        demandScore: demandScoreAfterBonus,
        refreshIntervalHours: finalInterval,
        lastRefreshedAt: new Date(now)
      });

      await setTopicLastRefresh(name, now);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`refreshTopics failed for topic="${name}":`, err);
    }
  }
}

