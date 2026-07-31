import { NextRequest, NextResponse } from "next/server";
import { fetchMeliDailySeries } from "@/lib/platforms/meli";
import { periodDateRange, rangeDurationDays } from "@/lib/platforms/period";
import type { Period } from "@/lib/platforms/types";
import { fetchStoredRange } from "@/lib/daily-metrics-store";

const MELI_LIVE_MAX_DAYS = 90;

export async function GET(request: NextRequest) {
  const dateFrom = request.nextUrl.searchParams.get("date_from");
  const dateTo = request.nextUrl.searchParams.get("date_to");
  const range =
    dateFrom && dateTo
      ? { dateFrom, dateTo }
      : periodDateRange((request.nextUrl.searchParams.get("period") ?? "30d") as Period);

  if (rangeDurationDays(range) > MELI_LIVE_MAX_DAYS) {
    try {
      const rows = await fetchStoredRange("meli", range.dateFrom, range.dateTo);
      const series = rows.map((r) => ({
        date: r.date,
        cost: r.cost,
        clicks: r.clicks,
        impressions: r.impressions,
        revenue: r.revenue,
        units: r.units,
      }));
      return NextResponse.json({ series, range, source: "stored" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar histórico do Mercado Livre Ads";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  try {
    const series = await fetchMeliDailySeries(range);
    return NextResponse.json({ series, range, source: "live" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar série diária do Mercado Livre Ads";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
