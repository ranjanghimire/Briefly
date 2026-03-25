-- Headline from news ingestion + full article text for AI summaries.

ALTER TABLE articles ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS raw_content text;
