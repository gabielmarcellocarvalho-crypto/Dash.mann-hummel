import { getSql } from "@/db/client";
import type { ChannelId } from "./platforms/types";

// Metas/realizado mensal — fonte real vem das planilhas de planejamento
// (Compilado/Amazon/Mercado Livre/Detalhamento 2026), importadas uma vez via
// scripts/seed-monthly-metrics.mjs. Guardado no banco pra nunca mais depender
// de um arquivo local ou de mock — a aba de Metas lê daqui.
export interface MonthlyChannelMetric {
  channelId: ChannelId;
  month: number; // 1-12
  meta: number | null;
  realizado: number | null;
  receitaAnoAnterior: number | null;
  sazonalidade: number | null; // percentual, ex.: 9.0 = 9,0%
  investimento: number | null;
  units: number | null;
  unitsAnoAnterior: number | null;
}

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const sql = getSql();
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS monthly_channel_metrics (
        channel_id TEXT NOT NULL,
        month INTEGER NOT NULL,
        meta NUMERIC,
        realizado NUMERIC,
        receita_ano_anterior NUMERIC,
        sazonalidade NUMERIC,
        investimento NUMERIC,
        units INTEGER,
        units_ano_anterior INTEGER,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (channel_id, month)
      )
    `.then(() => undefined);
  }
  return schemaReady;
}

export async function upsertMonthlyMetrics(rows: MonthlyChannelMetric[]): Promise<void> {
  if (rows.length === 0) return;
  await ensureSchema();
  const sql = getSql();

  for (const r of rows) {
    await sql`
      INSERT INTO monthly_channel_metrics
        (channel_id, month, meta, realizado, receita_ano_anterior, sazonalidade, investimento, units, units_ano_anterior, updated_at)
      VALUES
        (${r.channelId}, ${r.month}, ${r.meta}, ${r.realizado}, ${r.receitaAnoAnterior}, ${r.sazonalidade}, ${r.investimento}, ${r.units}, ${r.unitsAnoAnterior}, now())
      ON CONFLICT (channel_id, month) DO UPDATE SET
        meta = EXCLUDED.meta,
        realizado = EXCLUDED.realizado,
        receita_ano_anterior = EXCLUDED.receita_ano_anterior,
        sazonalidade = EXCLUDED.sazonalidade,
        investimento = EXCLUDED.investimento,
        units = EXCLUDED.units,
        units_ano_anterior = EXCLUDED.units_ano_anterior,
        updated_at = now()
    `;
  }
}

export async function fetchMonthlyMetrics(channelId: ChannelId): Promise<MonthlyChannelMetric[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT month, meta, realizado, receita_ano_anterior, sazonalidade, investimento, units, units_ano_anterior
    FROM monthly_channel_metrics
    WHERE channel_id = ${channelId}
    ORDER BY month ASC
  `) as Record<string, unknown>[];

  return rows.map((r) => ({
    channelId,
    month: Number(r.month),
    meta: r.meta === null ? null : Number(r.meta),
    realizado: r.realizado === null ? null : Number(r.realizado),
    receitaAnoAnterior: r.receita_ano_anterior === null ? null : Number(r.receita_ano_anterior),
    sazonalidade: r.sazonalidade === null ? null : Number(r.sazonalidade),
    investimento: r.investimento === null ? null : Number(r.investimento),
    units: r.units === null ? null : Number(r.units),
    unitsAnoAnterior: r.units_ano_anterior === null ? null : Number(r.units_ano_anterior),
  }));
}
