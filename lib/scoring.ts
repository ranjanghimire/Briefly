export const DAY_MS = 24 * 60 * 60 * 1000;
export const CLICK_DORMANCY_WINDOW_MS = 7 * DAY_MS;
export const RECENCY_BONUS_WINDOW_MS = 24 * 60 * 60 * 1000;

export function decayDemandScore(score: number): number {
  return Math.floor(score * 0.85);
}

export function applyRecencyBonusIfRecentlyRefreshed(
  previousLastRefreshedAtMs: number | null,
  nowMs: number
): number {
  if (!previousLastRefreshedAtMs) return 0;
  return nowMs - previousLastRefreshedAtMs <= RECENCY_BONUS_WINDOW_MS ? 5 : 0;
}

export function isTopicDormant(params: {
  demandScore: number;
  lastClickAtMs: number | null;
  nowMs: number;
}): boolean {
  if (params.demandScore >= 5) return false;
  if (!params.lastClickAtMs) return true; // never-clicked topics are dormant by rule
  return params.nowMs - params.lastClickAtMs >= CLICK_DORMANCY_WINDOW_MS;
}

// EXACT refresh-tier mapping requested.
export function refreshIntervalHoursFromDemandScore(demandScore: number): number {
  if (demandScore < 10) return 24;
  // Use non-overlapping ranges:
  // - 10–29 => 6 hours
  // - 30–59 => 3 hours
  // - 60+    => 1 hour
  if (demandScore >= 10 && demandScore < 30) return 6;
  if (demandScore >= 30 && demandScore < 60) return 3;
  return 1; // demandScore 60+
}

export function refreshIntervalHoursForTopic(params: {
  demandScore: number;
  lastClickAtMs: number | null;
  nowMs: number;
}): number {
  if (isTopicDormant(params)) return 48;
  return refreshIntervalHoursFromDemandScore(params.demandScore);
}

