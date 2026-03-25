import { kv } from "@vercel/kv";

export async function kvGetJson<T>(key: string): Promise<T | null> {
  const v = await kv.get<string>(key);
  if (v == null) return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    // If something was stored as a raw value instead of JSON.
    return v as unknown as T;
  }
}

export async function kvSetJson(key: string, value: unknown): Promise<void> {
  // Store as JSON for consistent parsing.
  await kv.set(key, JSON.stringify(value));
}

export async function kvGetNumber(key: string): Promise<number | null> {
  const v = await kv.get<string | number>(key);
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function kvSetNumber(key: string, value: number): Promise<void> {
  await kv.set(key, value);
}

export async function kvIncr(key: string, delta: number): Promise<number> {
  // @vercel/kv uses Upstash Redis underneath.
  // `incrby` supports arbitrary deltas atomically.
  const v = await kv.incrby(key, delta);
  return typeof v === "number" ? v : Number(v);
}

