"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import {
  BRIEFLY_CATEGORIES,
  CategoryBar,
  type UiCategory
} from "@/components/CategoryBar";
import { Card, type CardArticle } from "@/components/Card";
import { LongSummaryModal } from "@/components/LongSummaryModal";
import { BottomNav } from "@/components/BottomNav";
import { getCoreFeed, getMixedFeed } from "@/lib/api";
import type { ClientFeedArticle } from "@/lib/clientTypes";

type FeedPayload =
  | { articles: ClientFeedArticle[] }
  | { category: string; articles: ClientFeedArticle[] };

function fetcherForCategory(cat: UiCategory) {
  return async () => {
    if (cat.kind === "mixed") return getMixedFeed();
    return getCoreFeed(cat.coreSlug ?? "top");
  };
}

export default function FeedPage() {
  const [activeCat, setActiveCat] = useState<UiCategory>(
    BRIEFLY_CATEGORIES[0]
  );

  const { data, error, isLoading, mutate } = useSWR<FeedPayload>(
    ["feed", activeCat.key],
    fetcherForCategory(activeCat),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000
    }
  );

  const items = useMemo(() => {
    if (!data) return [];
    return data.articles ?? [];
  }, [data]);

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<CardArticle | null>(null);

  return (
    <div className="min-h-screen bg-[color:theme(colors.briefly.bg)] pb-20">
      <CategoryBar
        selectedKey={activeCat.key}
        onSelect={(c) => {
          setActiveCat(c);
        }}
      />

      <main className="mx-auto max-w-md px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[16px] font-medium text-black">
            {activeCat.label}
          </div>
          <button
            onClick={() => mutate()}
            className="rounded-full bg-[color:theme(colors.briefly.muted)] px-3 py-1.5 text-[12.5px] text-[color:theme(colors.briefly.meta)] hover:text-black"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[color:theme(colors.briefly.line)] bg-white p-5 text-[14px] text-[color:theme(colors.briefly.meta)]">
            Couldn&apos;t load the feed right now.
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
                article={a as any}
                onOpen={() => {
                  setCurrent(a as any);
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

