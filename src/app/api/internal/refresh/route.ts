import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";
import { executeCoreRefresh, executeTopicRefresh } from "@/lib/refreshExecution";
import { CORE_CATEGORIES } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const secret = process.env.INTERNAL_REFRESH_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
    if (bearer !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const obj = body as { category?: unknown; topic?: unknown };
  const category =
    typeof obj.category === "string" ? obj.category.trim() : "";
  const topic = typeof obj.topic === "string" ? obj.topic.trim() : "";

  if ((category && topic) || (!category && !topic)) {
    return NextResponse.json(
      { error: "Provide exactly one of category or topic" },
      { status: 400 }
    );
  }

  if (category && !CORE_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }

  try {
    if (category) {
      await executeCoreRefresh(category);
    } else {
      await executeTopicRefresh(topic);
    }
  } catch (err) {
    console.error("internal refresh worker error:", err);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
  
  return NextResponse.json({ ok: true });
  
}
