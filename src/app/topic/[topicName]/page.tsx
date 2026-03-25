"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

/**
 * Deep links only; custom topics render on /feed with the same chrome as core tabs.
 */
export default function TopicDeepLinkPage() {
  const router = useRouter();
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

  useEffect(() => {
    if (!topicName) {
      router.replace("/feed");
      return;
    }
    router.replace(`/feed?topic=${encodeURIComponent(topicName)}`);
  }, [topicName, router]);

  return (
    <div className="min-h-screen bg-[color:theme(colors.briefly.bg)] pb-20" />
  );
}
