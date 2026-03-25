import { NextResponse } from "next/server";
import { refreshTopics } from "../../../../../cron/refreshTopics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await refreshTopics();
  return NextResponse.json({ ok: true });
}

