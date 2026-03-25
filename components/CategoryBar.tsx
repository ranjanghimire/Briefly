"use client";

import { motion } from "framer-motion";

export type UiCategory = {
  key: string;
  label: string;
  kind: "mixed" | "core";
  // backend expects slug for core categories
  coreSlug?: string;
};

const categories: UiCategory[] = [
  { key: "for-you", label: "For You", kind: "mixed" },
  { key: "world", label: "World", kind: "core", coreSlug: "world" },
  { key: "tech", label: "Tech", kind: "core", coreSlug: "technology" },
  { key: "business", label: "Business", kind: "core", coreSlug: "business" },
  { key: "sports", label: "Sports", kind: "core", coreSlug: "sports" },
  { key: "health", label: "Health", kind: "core", coreSlug: "health" },
  { key: "science", label: "Science", kind: "core", coreSlug: "science" },
  // Backend doesn't have a dedicated "politics" core category; keep it mapped to world for now.
  { key: "politics", label: "Politics", kind: "core", coreSlug: "world" }
];

export function CategoryBar(props: {
  selectedKey: string;
  onSelect: (cat: UiCategory) => void;
}) {
  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-md px-4 pt-4">
        <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2">
            {categories.map((c) => {
              const selected = c.key === props.selectedKey;
              return (
                <button
                  key={c.key}
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
                      layoutId="briefly-cat"
                      className="absolute inset-0 rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
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

export const BRIEFLY_CATEGORIES = categories;

