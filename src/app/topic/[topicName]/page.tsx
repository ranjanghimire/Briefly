"use client";

import useSWR, { useSWRConfig } from "swr";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, type CardArticle } from "@/components/Card";
import { LongSummaryModal } from "@/components/LongSummaryModal";
import { BottomNav } from "@/components/BottomNav";
import {
  clickTopic,
  getCustomFeed,
  TOPICS_SWR_KEY
} from "@/lib/api";
import type { ClientFeedArticle } from "@/lib/clientTypes";

export default function TopicFeedPage() {
  const params = useParams();
  const rawParam = params.topicName;
  const raw = Array.isArray(rawParam) ? (rawParam[0] ?? "") : (rawParam ?? "");
  const topicName = useMemo(() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [raw]);
  const { mutate: globalMutate } = useSWRConfig();

  useEffect(() => {
    if (!topicName) return;
    void clickTopic(topicName)
      .then(() => globalMutate(TOPICS_SWR_KEY))
      .catch(() => {});
  }, [topicName, globalMutate]);

  const { data, error, isLoading, mutate } = useSWR(
    topicName ? ["custom-feed", topicName] : null,
    () => getCustomFeed(topicName),
    { revalidateOnFocus: true, dedupingInterval: 15_000 }
  );

  const items = useMemo((): ClientFeedArticle[] => {
    return data?.articles ?? [];
  }, [data]);

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<CardArticle | null>(null);

  return (
    <div className="min-h-screen bg-[color:theme(colors.briefly.bg)] pb-20">
      <header className="sticky top-0 z-30 border-b border-[color:theme(colors.briefly.line)] bg-white/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Link
            href="/feed"
            className="text-[14px] text-[color:theme(colors.briefly.meta)] hover:text-black"
          >
            ← Feed
          </Link>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[16px] font-medium text-black">
              {topicName || "Topic"}
            </div>
            <div className="text-[12px] text-[color:theme(colors.briefly.meta)]">
              Custom topic
            </div>
          </div>
          <button
            type="button"
            onClick={() => mutate()}
            className="rounded-full bg-[color:theme(colors.briefly.muted)] px-3 py-1.5 text-[12.5px] text-[color:theme(colors.briefly.meta)] hover:text-black"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-5">
        {error ? (
          <div className="rounded-2xl border border-[color:theme(colors.briefly.line)] bg-white p-5 text-[14px] text-[color:theme(colors.briefly.meta)]">
            Couldn&apos;t load this topic right now.
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-card bg-white shadow-card animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((a, idx) => (
              <Card
                key={idx}
                article={a as CardArticle}
                onOpen={() => {
                  setCurrent(a as CardArticle);
                  setOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      <LongSummaryModal
        open={open && Boolean(current)}
        onClose={() => setOpen(false)}
        title={current?.metadata.title ?? null}
        long_summary={current?.long_summary ?? ""}
        source={current?.metadata.source ?? null}
        publishedAt={current?.metadata.publishedAt ?? null}
        url={current?.metadata.url ?? null}
      />

      <BottomNav />
    </div>
  );
}
