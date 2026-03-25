"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedChipBar, type FeedChip } from "@/components/FeedChipBar";
import { Card, type CardArticle } from "@/components/Card";
import { LongSummaryModal } from "@/components/LongSummaryModal";
import { BottomNav } from "@/components/BottomNav";
import {
  getCoreFeed,
  getCustomFeed,
  getMixedFeed,
  getTopicsList,
  TOPICS_SWR_KEY
} from "@/lib/api";
import type { ClientFeedArticle, TopicsApiResponse } from "@/lib/clientTypes";

type FeedPayload =
  | { articles: ClientFeedArticle[] }
  | { category: string; articles: ClientFeedArticle[] };

const FOR_YOU_KEY = "for-you";

function fetcherForChip(chip: FeedChip) {
  return async () => {
    if (chip.kind === "mixed") return getMixedFeed();
    if (chip.kind === "core") return getCoreFeed(chip.slug);
    return getCustomFeed(chip.topicName);
  };
}

export default function FeedPage() {
  const router = useRouter();
  const [activeChip, setActiveChip] = useState<FeedChip>({
    key: FOR_YOU_KEY,
    kind: "mixed",
    label: "For You"
  });

  const { data: topicsData } = useSWR<TopicsApiResponse>(TOPICS_SWR_KEY, getTopicsList, {
    revalidateOnFocus: true,
    dedupingInterval: 10_000
  });

  const chips = useMemo((): FeedChip[] => {
    const list: FeedChip[] = [
      { key: FOR_YOU_KEY, kind: "mixed", label: "For You" }
    ];
    if (!topicsData?.core?.length) return list;
    for (const c of topicsData.core) {
      list.push({
        key: `core:${c.slug}`,
        kind: "core",
        label: c.label,
        slug: c.slug
      });
    }
    for (const t of topicsData.topics ?? []) {
      list.push({
        key: `topic:${t.name}`,
        kind: "topic",
        label: t.name,
        topicName: t.name
      });
    }
    return list;
  }, [topicsData]);

  const { data, error, isLoading, mutate } = useSWR<FeedPayload>(
    ["feed", activeChip.key],
    fetcherForChip(activeChip),
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
      <FeedChipBar
        chips={chips}
        selectedKey={activeChip.key}
        onSelect={(chip) => {
          if (chip.kind === "topic") {
            router.push(`/topic/${encodeURIComponent(chip.topicName)}`);
            return;
          }
          setActiveChip(chip);
        }}
      />

      <main className="mx-auto max-w-md px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[16px] font-medium text-black">
            {activeChip.label}
          </div>
          <button
            type="button"
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
