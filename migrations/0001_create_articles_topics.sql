-- Create canonical content tables for Briefly.
-- This migration is designed to be idempotent.

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY,
  category text,
  topic text,
  short_summary text,
  long_summary text,
  source text,
  url text,
  image_url text,
  published_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_category_updated_at
  ON articles (category, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_topic_updated_at
  ON articles (topic, updated_at DESC);

CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY,
  name text UNIQUE,
  demand_score int NOT NULL DEFAULT 0,
  refresh_interval_hours int NOT NULL DEFAULT 24,
  last_refreshed timestamptz
);

CREATE INDEX IF NOT EXISTS idx_topics_demand_score
  ON topics (demand_score DESC, last_refreshed DESC);

