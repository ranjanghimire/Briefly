import { cleanupOldArticles, getAllTopics, upsertTopic } from "../lib/db";
import {
  getTopicDemandScore,
  getTopicLastClick,
  setTopicDemandScore
} from "../lib/cache";
import {
  isTopicDormant,
  refreshIntervalHoursFromDemandScore
} from "../lib/scoring";
import { nowMs, topicIdFromName } from "../lib/utils";

const OLDER_THAN_DAYS = 14;

export async function cleanupArticles() {
  await cleanupOldArticles({ olderThanDays: OLDER_THAN_DAYS });

  const now = nowMs();
  const topics = await getAllTopics();
  if (topics.length === 0) return;

  for (const topic of topics) {
    const name = topic.name;
    try {
      const lastClickAt = (await getTopicLastClick(name)) ?? null;

      const dormant = isTopicDormant({
        demandScore: topic.demand_score,
        lastClickAtMs: lastClickAt,
        nowMs: now
      });
      const refreshIntervalHours = dormant
        ? 48
        : refreshIntervalHoursFromDemandScore(topic.demand_score);

      // Keep KV demand score aligned for fast reads.
      const kvScore =
        (await getTopicDemandScore(name)) ?? topic.demand_score;
      if (kvScore !== topic.demand_score) {
        await setTopicDemandScore(name, topic.demand_score);
      }

      await upsertTopic({
        id: topicIdFromName(name),
        name,
        demandScore: topic.demand_score,
        refreshIntervalHours,
        lastRefreshedAt: topic.last_refreshed
          ? new Date(topic.last_refreshed)
          : null
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`cleanupArticles topic="${name}" failed:`, err);
    }
  }
}

