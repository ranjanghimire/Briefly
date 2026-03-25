"use client";

import { X } from "lucide-react";

export function TopicPill(props: {
  name: string;
  onRemove?: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[color:theme(colors.briefly.muted)] px-4 py-2 text-[14px] text-[color:theme(colors.briefly.secondary)]">
      <span className="max-w-[220px] truncate">{props.name}</span>
      {props.onRemove ? (
        <button
          onClick={props.onRemove}
          className="rounded-full p-1 text-[color:theme(colors.briefly.meta)] hover:text-black"
          aria-label={`Remove ${props.name}`}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

