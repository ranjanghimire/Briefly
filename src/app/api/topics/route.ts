import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { CORE_CATEGORIES } from "@/lib/utils";
import { getAllTopics } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Display labels for core slugs (single source keyed by `CORE_CATEGORIES` order). */
const CORE_LABELS: Record<string, string> = {
  top: "Top",
  world: "World",
  business: "Business",
  technology: "Tech",
  health: "Health",
  sports: "Sports",
  entertainment: "Entertainment",
  science: "Science"
};

export async function GET() {
  const topics = await getAllTopics();
  const core = CORE_CATEGORIES.map((slug) => ({
    slug,
    label: CORE_LABELS[slug] ?? slug,
    kind: "core" as const
  }));
  const custom = topics.map((t) => ({
    name: t.name,
    demand_score: t.demand_score,
    last_refreshed: t.last_refreshed,
    kind: "topic" as const
  }));
  return NextResponse.json({ core, topics: custom });
}

export async function DELETE(req: Request) {
  const name = new URL(req.url).searchParams.get("name")?.trim() ?? "";
  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }
  await sql`DELETE FROM articles WHERE topic = ${name}`;
  await sql`DELETE FROM topics WHERE name = ${name}`;
  return NextResponse.json({ ok: true });
}
