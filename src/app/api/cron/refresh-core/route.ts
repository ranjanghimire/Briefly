import { NextResponse } from "next/server";
import { refreshCore } from "../../../../../cron/refreshCore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await refreshCore();
  return NextResponse.json({ ok: true });
}

