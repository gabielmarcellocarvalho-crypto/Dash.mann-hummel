import { getSql } from "@/db/client";
import type { ChannelId, ChannelSummary } from "./platforms/types";

// Histórico próprio de métricas diárias por canal — existe porque as APIs
// ao vivo têm janelas curtas (MELI recusa range > 90 dias; Amazon via Windsor
// só cobre os últimos 60 dias). Um cron popula isso dia a dia (ver
// /api/cron/collect-daily); daqui pra frente nunca mais perdemos um mês que
// já passou da janela da API ao vivo.
export interface StoredDailyMetric {
  channelId: ChannelId;
  date: string; // YYYY-MM-DD
  cost: number;
  clicks: number;
  impressions: number;
  revenue: number;
  units: number;
  revenueTracked: boolean;
}

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const sql = getSql();
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS daily_channel_metrics (
        channel_id TEXT NOT NULL,
        date DATE NOT NULL,
        cost NUMERIC NOT NULL DEFAULT 0,
        clicks INTEGER NOT NULL DEFAULT 0,
        impressions INTEGER NOT NULL DEFAULT 0,
        revenue NUMERIC NOT NULL DEFAULT 0,
        units INTEGER NOT NULL DEFAULT 0,
        revenue_tracked BOOLEAN NOT NULL DEFAULT false,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (channel_id, date)
      )
    `.then(() => undefined);
  }
  return schemaReady;
}

export async function upsertDailyMetrics(rows: StoredDailyMetric[]): Promise<void> {
  if (rows.length === 0) return;
  await ensureSchema();
  const sql = getSql();

  // Uma linha por vez — volume é baixo (poucas dezenas de linhas por execução
  // diária do cron), não vale a complexidade de um insert em lote aqui.
  for (const r of rows) {
    await sql`
      INSERT INTO daily_channel_metrics
        (channel_id, date, cost, clicks, impressions, revenue, units, revenue_tracked, updated_at)
      VALUES
        (${r.channelId}, ${r.date}, ${r.cost}, ${r.clicks}, ${r.impressions}, ${r.revenue}, ${r.units}, ${r.revenueTracked}, now())
      ON CONFLICT (channel_id, date) DO UPDATE SET
        cost = EXCLUDED.cost,
        clicks = EXCLUDED.clicks,
        impressions = EXCLUDED.impressions,
        revenue = EXCLUDED.revenue,
        units = EXCLUDED.units,
        revenue_tracked = EXCLUDED.revenue_tracked,
        updated_at = now()
    `;
  }
}

export async function fetchStoredRange(
  channelId: ChannelId,
  dateFrom: string,
  dateTo: string,
): Promise<StoredDailyMetric[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT date, cost, clicks, impressions, revenue, units, revenue_tracked
    FROM daily_channel_metrics
    WHERE channel_id = ${channelId} AND date BETWEEN ${dateFrom} AND ${dateTo}
    ORDER BY date ASC
  `) as Record<string, unknown>[];

  return rows.map((r) => ({
    channelId,
    date: typeof r.date === "string" ? r.date : new Date(r.date as string).toISOString().slice(0, 10),
    cost: Number(r.cost),
    clicks: Number(r.clicks),
    impressions: Number(r.impressions),
    revenue: Number(r.revenue),
    units: Number(r.units),
    revenueTracked: Boolean(r.revenue_tracked),
  }));
}

export function summarizeStored(channelId: ChannelId, rows: StoredDailyMetric[]): ChannelSummary {
  const revenueTracked = rows.length > 0 ? rows[0].revenueTracked : false;
  const investimento = rows.reduce((sum, r) => sum + r.cost, 0);
  const receita = rows.reduce((sum, r) => sum + r.revenue, 0);
  const cliques = rows.reduce((sum, r) => sum + r.clicks, 0);
  const impressoes = rows.reduce((sum, r) => sum + r.impressions, 0);
  const units = rows.reduce((sum, r) => sum + r.units, 0);

  return {
    channelId,
    investimento,
    receita,
    cliques,
    impressoes,
    ctr: impressoes > 0 ? cliques / impressoes : 0,
    cpc: cliques > 0 ? investimento / cliques : 0,
    roas: revenueTracked && investimento > 0 ? receita / investimento : null,
    acos: revenueTracked && receita > 0 ? investimento / receita : null,
    // Histórico agregado não guarda granularidade de campanha — só o cron
    // diário por canal. Consumidores que precisam de campanha a campanha
    // continuam na rota ao vivo (range curto).
    campanhasAtivas: 0,
    totalCampanhas: 0,
    revenueTracked,
    units,
  };
}
