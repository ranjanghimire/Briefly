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

