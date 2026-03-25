import { NextResponse } from "next/server";
import { decayScores } from "../../../../../cron/decayScores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await decayScores();
  return NextResponse.json({ ok: true });
}

