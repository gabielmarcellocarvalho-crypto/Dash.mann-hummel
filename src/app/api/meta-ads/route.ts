import { NextRequest, NextResponse } from "next/server";
import { fetchMetaAdsCampaigns, summarizeMetaAds } from "@/lib/platforms/meta-ads";
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
    const campaigns = await fetchMetaAdsCampaigns(range);
    const summary = summarizeMetaAds(campaigns);
    return NextResponse.json({ campaigns, summary, range });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar dados do Meta Ads";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
