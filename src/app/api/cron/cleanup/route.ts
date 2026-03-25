import { NextResponse } from "next/server";
import { cleanupArticles } from "../../../../../cron/cleanupArticles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await cleanupArticles();
  return NextResponse.json({ ok: true });
}

