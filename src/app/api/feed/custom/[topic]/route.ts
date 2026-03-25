import { NextResponse } from "next/server";
import { getCustomTopicArticles } from "@/lib/db";
import { getCachedSummaryPair } from "@/lib/cache";
import { isTopicStale } from "@/lib/feedStale";
import { triggerInternalRefresh } from "@/lib/internalRefreshTrigger";
import { executeTopicRefresh } from "@/lib/refreshExecution";
import { feedArticleDisplayTitle } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: { topic: string } }
) {
  const topic = params.topic;
  const limit = 20;
  let rows = await getCustomTopicArticles({ topic, limit });

  const staleInfo = await isTopicStale(topic);
  if (rows.length === 0) {
    await executeTopicRefresh(topic);
    rows = await getCustomTopicArticles({ topic, limit });
  } else if (staleInfo.stale) {
    void triggerInternalRefresh({ topic });
  }

  const cachedPairs = await Promise.all(rows.map((r) => getCachedSummaryPair(r.id)));

  const articles = rows.map((r, idx) => {
    const cached = cachedPairs[idx];
    const short_summary = cached?.short_summary ?? r.short_summary ?? "";
    return {
      short_summary,
      long_summary: cached?.long_summary ?? r.long_summary ?? "",
      metadata: {
        title: feedArticleDisplayTitle(r.title, short_summary),
        url: r.url,
        imageUrl: r.image_url,
        publishedAt: r.published_at,
        source: r.source,
        updatedAt: r.updated_at
      }
    };
  });

  return NextResponse.json({ topic, articles });
}

