import { sql } from "@vercel/postgres";
import type { ArticleRow, TopicRow } from "./types";

export async function getCoreArticles(params: {
  category: string;
  limit: number;
}): Promise<ArticleRow[]> {
  const { category, limit } = params;
  const result = await sql<ArticleRow>`
    SELECT
      id,
      category,
      topic,
      short_summary,
      long_summary,
      source,
      url,
      image_url,
      published_at,
      updated_at
    FROM articles
    WHERE category = ${category}
      AND topic IS NULL
    ORDER BY published_at DESC NULLS LAST, updated_at DESC
    LIMIT ${limit};
  `;
  return result.rows;
}

export async function getCustomTopicArticles(params: {
  topic: string;
  limit: number;
}): Promise<ArticleRow[]> {
  const { topic, limit } = params;
  const result = await sql<ArticleRow>`
    SELECT
      id,
      category,
      topic,
      short_summary,
      long_summary,
      source,
      url,
      image_url,
      published_at,
      updated_at
    FROM articles
    WHERE topic = ${topic}
      AND category IS NULL
    ORDER BY published_at DESC NULLS LAST, updated_at DESC
    LIMIT ${limit};
  `;
  return result.rows;
}

export async function getAllTopics(): Promise<TopicRow[]> {
  const result = await sql<TopicRow>`
    SELECT
      id,
      name,
      demand_score,
      refresh_interval_hours,
      last_refreshed
    FROM topics
    ORDER BY demand_score DESC, last_refreshed DESC;
  `;
  return result.rows;
}

export async function getTopicByName(name: string): Promise<TopicRow | null> {
  const result = await sql<TopicRow>`
    SELECT
      id,
      name,
      demand_score,
      refresh_interval_hours,
      last_refreshed
    FROM topics
    WHERE name = ${name}
    LIMIT 1;
  `;
  return result.rows[0] ?? null;
}

export async function upsertTopic(params: {
  id: string;
  name: string;
  demandScore: number;
  refreshIntervalHours: number;
  lastRefreshedAt?: Date | null;
}): Promise<void> {
  const { id, name, demandScore, refreshIntervalHours, lastRefreshedAt } =
    params;

  await sql`
    INSERT INTO topics (id, name, demand_score, refresh_interval_hours, last_refreshed)
    VALUES (
      ${id},
      ${name},
      ${Math.floor(demandScore)},
      ${Math.floor(refreshIntervalHours)},
      ${lastRefreshedAt ? lastRefreshedAt.toISOString() : null}
    )
    ON CONFLICT (name) DO UPDATE SET
      demand_score = EXCLUDED.demand_score,
      refresh_interval_hours = EXCLUDED.refresh_interval_hours,
      last_refreshed = COALESCE(EXCLUDED.last_refreshed, topics.last_refreshed);
  `;
}

export async function upsertArticles(params: {
  articles: Array<{
    id: string;
    category: string | null;
    topic: string | null;
    short_summary: string;
    long_summary: string;
    source: string | null;
    url: string;
    image_url: string | null;
    published_at: Date | null;
  }>;
}): Promise<void> {
  const { articles } = params;
  await Promise.all(
    articles.map((a) => {
      return sql`
        INSERT INTO articles (
          id,
          category,
          topic,
          short_summary,
          long_summary,
          source,
          url,
          image_url,
          published_at,
          updated_at
        )
        VALUES (
          ${a.id},
          ${a.category},
          ${a.topic},
          ${a.short_summary},
          ${a.long_summary},
          ${a.source},
          ${a.url},
          ${a.image_url},
          ${a.published_at ? a.published_at.toISOString() : null},
          now()
        )
        ON CONFLICT (id) DO UPDATE SET
          category = EXCLUDED.category,
          topic = EXCLUDED.topic,
          short_summary = EXCLUDED.short_summary,
          long_summary = EXCLUDED.long_summary,
          source = EXCLUDED.source,
          url = EXCLUDED.url,
          image_url = EXCLUDED.image_url,
          published_at = EXCLUDED.published_at,
          updated_at = now();
      `;
    })
  );
}

export async function cleanupOldArticles(params: { olderThanDays: number }) {
  const { olderThanDays } = params;
  await sql`
    DELETE FROM articles
    WHERE updated_at < NOW() - (${olderThanDays}::int * INTERVAL '1 day');
  `;
}

