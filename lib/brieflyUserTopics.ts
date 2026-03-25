"use client";

import { useSyncExternalStore } from "react";

export const BRIEFLY_USER_TOPICS_KEY = "briefly_user_topics";

const CHANGE_EVENT = "briefly-user-topics-change";

const EMPTY_SNAPSHOT: readonly string[] = Object.freeze([]);

let cachedSnapshot: { raw: string; names: readonly string[] } | null = null;

function normalizeParsed(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    if (typeof item !== "string") continue;
    const t = item.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function readRaw(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return localStorage.getItem(BRIEFLY_USER_TOPICS_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function getUserTopicNamesSnapshot(): readonly string[] {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  const raw = readRaw();
  if (cachedSnapshot?.raw === raw) return cachedSnapshot.names;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const names = Object.freeze(normalizeParsed(parsed));
    cachedSnapshot = { raw, names };
    return names;
  } catch {
    const names = Object.freeze([] as string[]);
    cachedSnapshot = { raw, names };
    return names;
  }
}

function invalidateCache() {
  cachedSnapshot = null;
}

function persist(names: string[]) {
  if (typeof window === "undefined") return;
  const normalized = normalizeParsed(names);
  try {
    localStorage.setItem(
      BRIEFLY_USER_TOPICS_KEY,
      JSON.stringify(normalized)
    );
  } catch {
    return;
  }
  invalidateCache();
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeUserTopics(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (e: StorageEvent) => {
    if (e.key === BRIEFLY_USER_TOPICS_KEY || e.key === null) {
      invalidateCache();
      onStoreChange();
    }
  };

  const onCustom = () => {
    invalidateCache();
    onStoreChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onCustom);
  };
}

export function addUserTopic(name: string) {
  const t = name.trim();
  if (!t || typeof window === "undefined") return;
  const current = [...getUserTopicNamesSnapshot()];
  if (current.includes(t)) return;
  current.push(t);
  persist(current);
}

export function removeUserTopic(name: string) {
  const t = name.trim();
  if (!t || typeof window === "undefined") return;
  const current = [...getUserTopicNamesSnapshot()].filter((n) => n !== t);
  persist(current);
}

export function useUserTopics(): readonly string[] {
  return useSyncExternalStore(
    subscribeUserTopics,
    getUserTopicNamesSnapshot,
    () => EMPTY_SNAPSHOT
  );
}
