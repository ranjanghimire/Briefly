import { NextResponse } from "next/server";
import { bumpTopicDemandScore, setTopicLastClick } from "@/lib/cache";
import { upsertTopic } from "@/lib/db";
import { refreshIntervalHoursForTopic } from "@/lib/scoring";
import { nowMs, topicIdFromName } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  _req: Request,
  { params }: { params: { topic: string } }
) {
  const topic = params.topic;
  const now = nowMs();

  // 1) Update KV immediately (atomic where possible).
  const demandScore = await bumpTopicDemandScore(topic, 3);

  // Record click time for dormancy checks.
  await setTopicLastClick(topic, now);

  // 2) Update Postgres asynchronously to avoid slowing the UI.
  const refreshIntervalHours = refreshIntervalHoursForTopic({
    demandScore,
    lastClickAtMs: now,
    nowMs: now
  });

  void upsertTopic({
    id: topicIdFromName(topic),
    name: topic,
    demandScore,
    refreshIntervalHours,
    lastRefreshedAt: null
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Postgres topic upsert failed:", err);
  });

  return NextResponse.json({ demandScore });
}

