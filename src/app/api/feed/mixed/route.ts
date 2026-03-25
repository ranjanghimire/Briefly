import { NextResponse } from "next/server";
import { CORE_CATEGORIES } from "@/lib/utils";
import { getAllTopics, getCoreArticles, getCustomTopicArticles } from "@/lib/db";
import { getCachedSummaryPair } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const limitPerSource = 5;
  const coreSources = CORE_CATEGORIES.slice(0, 3);

  const topics = await getAllTopics();
  const topCustomTopics = topics.slice(0, 3).map((t) => t.name);

  const corePromises = coreSources.map((c) =>
    getCoreArticles({ category: c, limit: limitPerSource })
  );
  const customPromises = topCustomTopics.map((t) =>
    getCustomTopicArticles({ topic: t, limit: limitPerSource })
  );

  const [coreLists, customLists] = await Promise.all([
    Promise.all(corePromises),
    Promise.all(customPromises)
  ]);

  const allArticles = [...coreLists.flat(), ...customLists.flat()];
  const cachedPairs = await Promise.all(
    allArticles.map((r) => getCachedSummaryPair(r.id))
  );

  const articles = allArticles.slice(0, 20).map((r, idx) => {
    const cached = cachedPairs[idx];
    const short_summary = cached?.short_summary ?? r.short_summary ?? "";
    const inferredTitle = short_summary.split("\n").map((s) => s.trim()).find(Boolean) ?? null;
    return {
      short_summary,
      long_summary: cached?.long_summary ?? r.long_summary ?? "",
      metadata: {
        title: inferredTitle,
        url: r.url,
        imageUrl: r.image_url,
        publishedAt: r.published_at,
        source: r.source,
        updatedAt: r.updated_at
      }
    };
  });

  return NextResponse.json({ articles });
}

