import { NextRequest, NextResponse } from "next/server";
import { fetchMeliCampaigns, summarizeMeli } from "@/lib/platforms/meli";
import { periodDateRange, rangeDurationDays } from "@/lib/platforms/period";
import type { Period } from "@/lib/platforms/types";
import { fetchStoredRange, summarizeStored } from "@/lib/daily-metrics-store";

// A API de Ads do MELI recusa qualquer intervalo > 90 dias (erro 400). Acima
// disso, servimos do histórico próprio (populado pelo cron diário) em vez de
// falhar — sem campanha a campanha, só o agregado do período.
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
      const summary = summarizeStored("meli", rows);
      return NextResponse.json({ campaigns: [], summary, range, source: "stored" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar histórico do Mercado Livre Ads";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  try {
    const campaigns = await fetchMeliCampaigns(range);
    const summary = summarizeMeli(campaigns);
    return NextResponse.json({ campaigns, summary, range, source: "live" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar dados do Mercado Livre Ads";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
