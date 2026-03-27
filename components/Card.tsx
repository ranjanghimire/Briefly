"use client";

import { motion } from "framer-motion";

export type CardArticle = {
  short_summary: string;
  long_summary: string;
  metadata: {
    title?: string | null;
    source?: string | null;
    publishedAt?: string | null;
    updatedAt?: string | null;
    imageUrl?: string | null;
    url?: string | null;
  };
};

function formatRelativeTime(iso?: string | null) {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function Card(props: {
  article: CardArticle;
  onOpen: () => void;
}) {
  const { article } = props;
  const source = article.metadata.source ?? "Unknown";
  const ts = formatRelativeTime(article.metadata.publishedAt ?? article.metadata.updatedAt);
  const showThumb = Boolean(article.metadata.imageUrl);

  return (
    <motion.button
      onClick={props.onOpen}
      whileTap={{ scale: 0.985 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="w-full text-left"
    >
      <div className="rounded-card bg-white shadow-card">
        <div className="flex gap-3 p-4">
          <div className="min-w-0 flex-1">
          <div className="text-[16px] leading-snug text-black line-clamp-3">
            {article.short_summary}
          </div>


            <div className="mt-3 text-[12.5px] text-[color:theme(colors.briefly.meta)]">
              <span className="truncate">{source}</span>
              {ts ? <span className="mx-2">·</span> : null}
              {ts ? <span>{ts}</span> : null}
            </div>
          </div>

          {showThumb ? (
            <div className="h-14 w-14 flex-none overflow-hidden rounded-xl bg-[color:theme(colors.briefly.muted)]">
              {/* Intentionally subtle: no heavy image styling */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.metadata.imageUrl ?? ""}
                alt=""
                className="h-full w-full object-cover opacity-90"
                loading="lazy"
              />
            </div>
          ) : null}
        </div>
      </div>
    </motion.button>
  );
}

