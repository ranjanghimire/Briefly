"use client";

import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { TopicPill } from "@/components/TopicPill";
import { AddTopicModal } from "@/components/AddTopicModal";
import {
  clickTopic,
  deleteTopicByName,
  getTopicsList,
  TOPICS_SWR_KEY
} from "@/lib/api";

export default function TopicsPage() {
  const [open, setOpen] = useState(false);
  const [busyTopic, setBusyTopic] = useState<string | null>(null);
  const { mutate: globalMutate } = useSWRConfig();

  const { data, error, isLoading } = useSWR(TOPICS_SWR_KEY, getTopicsList, {
    revalidateOnFocus: true,
    dedupingInterval: 10_000
  });

  const sorted = useMemo(() => {
    const names = (data?.topics ?? []).map((t) => t.name);
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [data?.topics]);

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="mx-auto max-w-md px-4 pt-6">
        <div className="text-[18px] font-medium text-black">Topics</div>
        <div className="mt-1 text-[13px] text-[color:theme(colors.briefly.meta)]">
          Add a topic — it appears on the{" "}
          <Link href="/feed" className="underline underline-offset-2">
            Feed
          </Link>
          . Open it there to boost demand and refresh.
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="text-[14px] text-[color:theme(colors.briefly.secondary)]">
            Your topics
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full bg-[color:theme(colors.briefly.muted)] px-4 py-2 text-[14px] text-black shadow-pill"
          >
            + Add Topic
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[color:theme(colors.briefly.line)] bg-white p-5 text-[14px] text-[color:theme(colors.briefly.meta)]">
            Couldn&apos;t load topics.
          </div>
        ) : null}

        {isLoading && !data ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded-full bg-[color:theme(colors.briefly.muted)] animate-pulse" />
            ))}
          </div>
        ) : null}

        {!isLoading && sorted.length === 0 ? (
          <div className="rounded-2xl border border-[color:theme(colors.briefly.line)] bg-white p-5 text-[14px] text-[color:theme(colors.briefly.meta)]">
            No topics yet. Add one — it will show on the Feed home screen.
          </div>
        ) : null}

        {sorted.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {sorted.map((t) => (
              <TopicPill
                key={t}
                name={t}
                onRemove={() => {
                  void (async () => {
                    try {
                      await deleteTopicByName(t);
                      await globalMutate(TOPICS_SWR_KEY);
                    } catch {
                      // ignore
                    }
                  })();
                }}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-10 rounded-2xl bg-[color:theme(colors.briefly.muted)] p-5">
          <div className="text-[14px] font-medium text-black">Tip</div>
          <div className="mt-2 text-[13px] leading-relaxed text-[color:theme(colors.briefly.meta)]">
            Each time you open a topic from the Feed, Briefly records a tap (+3 demand) and
            refreshes when stale — so topics stay fresh and show up in For You.
          </div>
        </div>
      </main>

      <AddTopicModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={async (topic) => {
          setBusyTopic(topic);
          try {
            await clickTopic(topic);
            await globalMutate(TOPICS_SWR_KEY);
          } finally {
            setBusyTopic(null);
          }
        }}
      />

      {busyTopic ? (
        <div className="fixed bottom-20 left-0 right-0 z-40">
          <div className="mx-auto max-w-md px-4">
            <div className="rounded-2xl bg-white px-4 py-3 text-[13px] text-[color:theme(colors.briefly.meta)] shadow-card">
              Adding “{busyTopic}”…
            </div>
          </div>
        </div>
      ) : null}

      <BottomNav />
    </div>
  );
}
