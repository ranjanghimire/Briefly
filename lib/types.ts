export type NormalizedArticle = {
  title: string;
  description?: string;
  url: string;
  imageUrl?: string | null;
  publishedAt?: string | null; // ISO string, if provided
  source?: string | null;
};

export type FeedArticle = {
  id: string;
  category: string | null;
  topic: string | null;
  short_summary: string;
  long_summary: string;
  source: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

export type CoreCategory = string;

export type TopicRow = {
  id: string;
  name: string;
  demand_score: number;
  refresh_interval_hours: number;
  last_refreshed: string | null;
};

export type ArticleRow = {
  id: string;
  category: string | null;
  topic: string | null;
  short_summary: string | null;
  long_summary: string | null;
  source: string | null;
  url: string;
  image_url: string | null;
  published_at: string | null;
  updated_at: string;
};

