import { fetchNewsForCoreCategory } from "../lib/fetcher";
import { summarizeArticle } from "../lib/summarizer";
import { CORE_CATEGORIES, articleIdFromScopeAndUrl, nowMs } from "../lib/utils";
import { getCoreLastRefresh, setCoreLastRefresh, setCachedSummaryPair } from "../lib/cache";
import { upsertArticles } from "../lib/db";

const CORE_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const CORE_ARTICLE_LIMIT = 10;

export async function refreshCore() {
  const now = nowMs();

  for (const category of CORE_CATEGORIES) {
    try {
      const last = await getCoreLastRefresh(category);

      if (last && now - last < CORE_REFRESH_INTERVAL_MS) continue;

      const fetched = await fetchNewsForCoreCategory({
        category,
        limit: CORE_ARTICLE_LIMIT
      });

      const articlesToUpsert = [];
      for (const a of fetched) {
        const { short_summary, long_summary } = await summarizeArticle({
          article: a
        });
        const id = articleIdFromScopeAndUrl({
          scopeType: "core",
          scopeName: category,
          url: a.url
        });

        articlesToUpsert.push({
          id,
          category,
          topic: null,
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
      console.error(`refreshCore failed for category="${category}":`, err);
    }
  }
}

