import { NextResponse } from "next/server";
import { CORE_CATEGORIES } from "@/lib/utils";
import { getCoreArticles } from "@/lib/db";
import { getCachedSummaryPair } from "@/lib/cache";
import { isCoreCategoryStale } from "@/lib/feedStale";
import { triggerInternalRefresh } from "@/lib/internalRefreshTrigger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: { category: string } }
) {
  const category = params.category;
  if (!CORE_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: "Unknown category" },
      { status: 400 }
    );
  }

  const limit = 20;
  const rows = await getCoreArticles({ category, limit });

  void isCoreCategoryStale(category).then((stale) => {
    if (stale) triggerInternalRefresh({ category });
  });

  const cachedPairs = await Promise.all(
    rows.map((r) => getCachedSummaryPair(r.id))
  );

  const articles = rows.map((r, idx) => {
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

  return NextResponse.json({ category, articles });
}

