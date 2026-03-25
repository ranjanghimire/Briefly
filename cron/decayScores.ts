import { getAllTopics, upsertTopic } from "../lib/db";
import { getTopicDemandScore, getTopicLastClick, setTopicDemandScore } from "../lib/cache";
import {
  decayDemandScore,
  isTopicDormant,
  refreshIntervalHoursFromDemandScore
} from "../lib/scoring";
import { nowMs, topicIdFromName } from "../lib/utils";

export async function decayScores() {
  const now = nowMs();
  const topics = await getAllTopics();
  if (topics.length === 0) return;

  for (const topic of topics) {
    const name = topic.name;
    try {
      const liveKvScore =
        (await getTopicDemandScore(name)) ?? topic.demand_score;

      // Sync KV -> Postgres canonical score, then decay.
      const decayedScore = decayDemandScore(liveKvScore);

      const lastClickAt = (await getTopicLastClick(name)) ?? null;
      const dormant = isTopicDormant({
        demandScore: decayedScore,
        lastClickAtMs: lastClickAt,
        nowMs: now
      });
      const refreshIntervalHours = dormant
        ? 48
        : refreshIntervalHoursFromDemandScore(decayedScore);

      // Persist canonical score + intervals.
      await upsertTopic({
        id: topicIdFromName(name),
        name,
        demandScore: decayedScore,
        refreshIntervalHours,
        lastRefreshedAt: topic.last_refreshed
          ? new Date(topic.last_refreshed)
          : null
      });

      // Write back to KV so reads are fast and consistent.
      await setTopicDemandScore(name, decayedScore);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`decayScores failed for topic="${name}":`, err);
    }
  }
}

