import { NextResponse } from "next/server";
import { CORE_CATEGORIES } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ categories: CORE_CATEGORIES });
}

