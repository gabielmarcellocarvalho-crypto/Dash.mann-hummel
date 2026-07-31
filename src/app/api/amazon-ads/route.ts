import { NextRequest, NextResponse } from "next/server";
import { fetchAmazonCampaigns, summarizeAmazon } from "@/lib/platforms/amazon";
import { periodDateRange, rangeDurationDays } from "@/lib/platforms/period";
import type { Period } from "@/lib/platforms/types";
import { fetchStoredRange, summarizeStored } from "@/lib/daily-metrics-store";

// O conector Windsor.ai só cobre os últimos 60 dias de relatório da Amazon —
// acima disso ele corta a data silenciosamente e devolve os mesmos 60 dias.
// Servimos do histórico próprio (cron diário) pra não mostrar dado errado.
const AMAZON_LIVE_MAX_DAYS = 60;

export async function GET(request: NextRequest) {
  const dateFrom = request.nextUrl.searchParams.get("date_from");
  const dateTo = request.nextUrl.searchParams.get("date_to");
  const range =
    dateFrom && dateTo
      ? { dateFrom, dateTo }
      : periodDateRange((request.nextUrl.searchParams.get("period") ?? "30d") as Period);

  if (rangeDurationDays(range) > AMAZON_LIVE_MAX_DAYS) {
    try {
      const rows = await fetchStoredRange("amazon", range.dateFrom, range.dateTo);
      const summary = summarizeStored("amazon", rows);
      return NextResponse.json({ campaigns: [], summary, range, source: "stored" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar histórico da Amazon Ads";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  try {
    const campaigns = await fetchAmazonCampaigns(range);
    const summary = summarizeAmazon(campaigns);
    return NextResponse.json({ campaigns, summary, range, source: "live" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar dados da Amazon Ads";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
