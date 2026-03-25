"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { TopicPill } from "@/components/TopicPill";
import { AddTopicModal } from "@/components/AddTopicModal";
import { clickTopic } from "@/lib/api";

const STORAGE_KEY = "briefly:topics";

function loadTopics(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => String(v).trim())
      .filter(Boolean)
      .slice(0, 50);
  } catch {
    return [];
  }
}

function saveTopics(topics: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [busyTopic, setBusyTopic] = useState<string | null>(null);

  useEffect(() => {
    setTopics(loadTopics());
  }, []);

  const sorted = useMemo(() => {
    return [...topics].sort((a, b) => a.localeCompare(b));
  }, [topics]);

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="mx-auto max-w-md px-4 pt-6">
        <div className="text-[18px] font-medium text-black">Topics</div>
        <div className="mt-1 text-[13px] text-[color:theme(colors.briefly.meta)]">
          Add a topic you care about. Briefly will learn from what you tap.
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="text-[14px] text-[color:theme(colors.briefly.secondary)]">
            Your topics
          </div>
          <button
            onClick={() => setOpen(true)}
            className="rounded-full bg-[color:theme(colors.briefly.muted)] px-4 py-2 text-[14px] text-black shadow-pill"
          >
            + Add Topic
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-[color:theme(colors.briefly.line)] bg-white p-5 text-[14px] text-[color:theme(colors.briefly.meta)]">
            No topics yet. Add one to start shaping your “For You” feed.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sorted.map((t) => (
              <TopicPill
                key={t}
                name={t}
                onRemove={() => {
                  const next = topics.filter((x) => x !== t);
                  setTopics(next);
                  saveTopics(next);
                }}
              />
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl bg-[color:theme(colors.briefly.muted)] p-5">
          <div className="text-[14px] font-medium text-black">
            Tip
          </div>
          <div className="mt-2 text-[13px] leading-relaxed text-[color:theme(colors.briefly.meta)]">
            When you tap a topic in the app, Briefly boosts its demand score on the backend.
            That helps decide how often it refreshes.
          </div>
        </div>
      </main>

      <AddTopicModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={async (topic) => {
          const next = Array.from(new Set([topic, ...topics])).slice(0, 50);
          setTopics(next);
          saveTopics(next);

          // Give the topic an initial signal (+3) by recording a click.
          setBusyTopic(topic);
          try {
            await clickTopic(topic);
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

