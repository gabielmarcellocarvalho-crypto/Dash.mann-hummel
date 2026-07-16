import { NextRequest, NextResponse } from "next/server";
import { fetchGoogleAdsDailySeries } from "@/lib/platforms/google-ads";
import { periodDateRange } from "@/lib/platforms/period";
import type { Period } from "@/lib/platforms/types";

export async function GET(request: NextRequest) {
  const dateFrom = request.nextUrl.searchParams.get("date_from");
  const dateTo = request.nextUrl.searchParams.get("date_to");
  const range =
    dateFrom && dateTo
      ? { dateFrom, dateTo }
      : periodDateRange((request.nextUrl.searchParams.get("period") ?? "30d") as Period);

  try {
    const series = await fetchGoogleAdsDailySeries(range);
    return NextResponse.json({ series, range });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar série diária do Google Ads";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
