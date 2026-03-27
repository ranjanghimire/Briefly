import { NextResponse } from "next/server";
import { executeCoreRefresh } from "@/lib/refreshExecution";
import { CORE_CATEGORIES } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    for (const category of CORE_CATEGORIES) {
      await executeCoreRefresh(category);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Cron refresh error:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
