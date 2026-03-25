"use client";

import useSWR, { useSWRConfig } from "swr";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { FeedChipBar, type FeedChip } from "@/components/FeedChipBar";
import { Card, type CardArticle } from "@/components/Card";
import { LongSummaryModal } from "@/components/LongSummaryModal";
import { BottomNav } from "@/components/BottomNav";
import {
  clickTopic,
  getCoreFeed,
  getCustomFeed,
  getMixedFeed,
  getTopicsList,
  TOPICS_SWR_KEY
} from "@/lib/api";
import type { ClientFeedArticle, TopicsApiResponse } from "@/lib/clientTypes";
import { useUserTopics } from "@/lib/brieflyUserTopics";

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

function FeedPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicFromUrl = searchParams.get("topic");
  const { mutate: globalMutate } = useSWRConfig();
  const userTopics = useUserTopics();

  const [activeChip, setActiveChip] = useState<FeedChip>({
    key: FOR_YOU_KEY,
    kind: "mixed",
    label: "For You"
  });

  const { data: topicsData } = useSWR<TopicsApiResponse>(TOPICS_SWR_KEY, getTopicsList, {
    revalidateOnFocus: true,
    dedupingInterval: 10_000
  });

  const userTopicSet = useMemo(() => new Set(userTopics), [userTopics]);

  useEffect(() => {
    if (!topicsData?.topics) return;
    const name = topicFromUrl?.trim();
    if (!name) return;

    const existsGlobal = topicsData.topics.some((t) => t.name === name);
    if (existsGlobal && userTopicSet.has(name)) {
      setActiveChip({
        key: `topic:${name}`,
        kind: "topic",
        label: name,
        topicName: name
      });
    } else {
      router.replace("/feed", { scroll: false });
    }
  }, [topicsData, topicFromUrl, userTopicSet, router]);

  useEffect(() => {
    if (activeChip.kind !== "topic") return;
    if (userTopicSet.has(activeChip.topicName)) return;
    setActiveChip({
      key: FOR_YOU_KEY,
      kind: "mixed",
      label: "For You"
    });
    router.replace("/feed", { scroll: false });
  }, [activeChip, userTopicSet, router]);

  const customTopicName =
    activeChip.kind === "topic" ? activeChip.topicName : null;
  useEffect(() => {
    if (!customTopicName) return;
    void clickTopic(customTopicName)
      .then(() => globalMutate(TOPICS_SWR_KEY))
      .catch(() => {});
  }, [customTopicName, globalMutate]);

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
      if (!userTopicSet.has(t.name)) continue;
      list.push({
        key: `topic:${t.name}`,
        kind: "topic",
        label: t.name,
        topicName: t.name
      });
    }
    return list;
  }, [topicsData, userTopicSet]);

  const { data, error, isLoading } = useSWR<FeedPayload>(
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
            setActiveChip(chip);
            router.replace(`/feed?topic=${encodeURIComponent(chip.topicName)}`, {
              scroll: false
            });
            return;
          }
          setActiveChip(chip);
          router.replace("/feed", { scroll: false });
        }}
      />

      <main className="mx-auto max-w-md px-4 py-5">
        {error ? (
          <div className="rounded-2xl border border-[color:theme(colors.briefly.line)] bg-white p-5 text-[14px] text-[color:theme(colors.briefly.meta)]">
            Couldn&apos;t load the feed right now.
          </div>
        ) : null}

        {isLoading && activeChip.kind === "topic" ? (
          <div
            className="rounded-2xl border border-[color:theme(colors.briefly.line)] bg-white p-8 text-center shadow-card"
            role="status"
            aria-live="polite"
          >
            <Loader2
              className="mx-auto h-10 w-10 animate-spin text-[color:theme(colors.briefly.meta)]"
              aria-hidden
            />
            <p className="mt-5 text-[15px] font-medium text-black">
              Gathering news for {activeChip.label}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[color:theme(colors.briefly.meta)]">
              We&apos;re fetching and summarizing articles. The first load can take
              a little while—hang tight.
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            <div
              className="flex items-center justify-center gap-2 py-3 text-[13px] text-[color:theme(colors.briefly.meta)]"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              Loading stories…
            </div>
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

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[color:theme(colors.briefly.bg)] pb-20" />
      }
    >
      <FeedPageInner />
    </Suspense>
  );
}
