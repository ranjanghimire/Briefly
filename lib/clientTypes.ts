export type ClientFeedArticle = {
  short_summary: string;
  long_summary: string;
  metadata: {
    title?: string | null;
    url?: string | null;
    imageUrl?: string | null;
    publishedAt?: string | null;
    source?: string | null;
    updatedAt?: string | null;
  };
};

export type ClientFeedResponse = {
  articles: ClientFeedArticle[];
};

export type TopicsApiCore = {
  slug: string;
  label: string;
  kind: "core";
};

export type TopicsApiCustom = {
  name: string;
  demand_score: number;
  last_refreshed: string | null;
  kind: "topic";
};

export type TopicsApiResponse = {
  core: TopicsApiCore[];
  topics: TopicsApiCustom[];
};

