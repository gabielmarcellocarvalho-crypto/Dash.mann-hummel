import { NextRequest, NextResponse } from "next/server";
import { fetchMetaAdsDailySeries } from "@/lib/platforms/meta-ads";
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
    const series = await fetchMetaAdsDailySeries(range);
    return NextResponse.json({ series, range });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar série diária do Meta Ads";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
