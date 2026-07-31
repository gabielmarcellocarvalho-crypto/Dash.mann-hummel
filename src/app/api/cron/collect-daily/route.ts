import { NextRequest, NextResponse } from "next/server";
import { fetchMeliDailySeries } from "@/lib/platforms/meli";
import { fetchAmazonDailySeries } from "@/lib/platforms/amazon";
import { fetchGoogleAdsDailySeries } from "@/lib/platforms/google-ads";
import { fetchMetaAdsDailySeries } from "@/lib/platforms/meta-ads";
import { REVENUE_TRACKED, type ChannelId, type DailyPoint, type DateRange } from "@/lib/platforms/types";
import { upsertDailyMetrics, type StoredDailyMetric } from "@/lib/daily-metrics-store";

const FETCHERS: Record<ChannelId, (range: DateRange) => Promise<DailyPoint[]>> = {
  meli: fetchMeliDailySeries,
  amazon: fetchAmazonDailySeries,
  google: fetchGoogleAdsDailySeries,
  meta: fetchMetaAdsDailySeries,
};

const ALL_CHANNELS: ChannelId[] = ["meli", "google", "amazon", "meta"];

// Janela de 4 dias (hoje + 3 anteriores): cobre o dia de hoje ainda parcial e
// dá margem pra reprocessar caso uma execução anterior do cron tenha falhado
// (upsert é idempotente por channel_id+date).
function lastDaysRange(days: number): DateRange {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - (days - 1));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { dateFrom: fmt(from), dateTo: fmt(to) };
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  const range = lastDaysRange(4);
  const results: Record<string, { stored: number } | { error: string }> = {};

  for (const channelId of ALL_CHANNELS) {
    try {
      const series = await FETCHERS[channelId](range);
      const rows: StoredDailyMetric[] = series.map((p) => ({
        channelId,
        date: p.date,
        cost: p.cost,
        clicks: p.clicks,
        impressions: p.impressions,
        revenue: p.revenue,
        units: p.units,
        revenueTracked: REVENUE_TRACKED[channelId],
      }));
      await upsertDailyMetrics(rows);
      results[channelId] = { stored: rows.length };
    } catch (error) {
      results[channelId] = { error: error instanceof Error ? error.message : "Erro desconhecido" };
    }
  }

  return NextResponse.json({ range, results });
}
