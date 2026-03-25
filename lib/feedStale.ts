import {
  getCoreLastRefresh,
  getTopicDemandScore,
  getTopicLastClick,
  getTopicLastRefresh
} from "./cache";
import { getTopicByName } from "./db";
import { refreshIntervalHoursForTopic } from "./scoring";
import { nowMs } from "./utils";

const CORE_REFRESH_INTERVAL_HOURS = 24;

function hoursToMs(hours: number) {
  return hours * 60 * 60 * 1000;
}

export async function isCoreCategoryStale(category: string): Promise<boolean> {
  const now = nowMs();
  const last = await getCoreLastRefresh(category);
  if (last == null) return true;
  return now - last >= hoursToMs(CORE_REFRESH_INTERVAL_HOURS);
}

export async function isTopicStale(topic: string): Promise<{
  stale: boolean;
  intervalHours: number;
}> {
  const now = nowMs();
  const [lastRefresh, kvScore, lastClick, topicRow] = await Promise.all([
    getTopicLastRefresh(topic),
    getTopicDemandScore(topic),
    getTopicLastClick(topic),
    getTopicByName(topic)
  ]);

  const liveScore = kvScore ?? topicRow?.demand_score ?? 0;
  const intervalHours = refreshIntervalHoursForTopic({
    demandScore: liveScore,
    lastClickAtMs: lastClick,
    nowMs: now
  });

  if (lastRefresh == null) return { stale: true, intervalHours };
  return {
    stale: now - lastRefresh >= hoursToMs(intervalHours),
    intervalHours
  };
}
