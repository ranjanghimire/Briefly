"use client";

import { motion } from "framer-motion";

export type FeedChip =
  | { key: string; kind: "mixed"; label: string }
  | { key: string; kind: "core"; label: string; slug: string }
  | { key: string; kind: "topic"; label: string; topicName: string };

export function FeedChipBar(props: {
  chips: FeedChip[];
  selectedKey: string;
  onSelect: (chip: FeedChip) => void;
}) {
  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-md px-4 pt-4">
        <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2">
            {props.chips.map((c) => {
              const selected = c.key === props.selectedKey;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => props.onSelect(c)}
                  className={[
                    "relative whitespace-nowrap rounded-full px-4 py-2 text-[14px] leading-none transition",
                    selected
                      ? "bg-white text-black shadow-pill"
                      : "bg-[color:theme(colors.briefly.muted)] text-[color:theme(colors.briefly.secondary)]"
                  ].join(" ")}
                >
                  {selected && (
                    <motion.span
                      layoutId="briefly-feed-chip"
                      className="absolute inset-0 rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 40
                      }}
                    />
                  )}
                  <span className="relative">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="h-px w-full bg-[color:theme(colors.briefly.line)]" />
    </div>
  );
}
