// Importa os dados reais das planilhas de planejamento (2025/2026) pro banco.
// Fonte: [MANN HUMMEL] METAS 2026 - AMAZON.csv / MERCADO LIVRE.csv / DETALHAMENTO 2026.csv
// Rodar uma vez (ou de novo quando a planilha for atualizada):
//   npx dotenv -e .env.local -- node scripts/seed-monthly-metrics.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`
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
    ads_meta NUMERIC,
    ads_realizado NUMERIC,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (channel_id, month)
  )
`;
await sql`ALTER TABLE monthly_channel_metrics ADD COLUMN IF NOT EXISTS ads_meta NUMERIC`;
await sql`ALTER TABLE monthly_channel_metrics ADD COLUMN IF NOT EXISTS ads_realizado NUMERIC`;

// month: 1=Jan ... 12=Dez. null = ainda não aconteceu / planilha não preencheu.
const AMAZON = [
  { month: 1, meta: 33000.00, realizado: 29055.98, anoAnterior: 25174.00, sazon: 9.0, invest: 0.00, units: 989, unitsAnt: 238 },
  { month: 2, meta: 33000.00, realizado: 25293.13, anoAnterior: 7398.22, sazon: 2.7, invest: 0.00, units: 808, unitsAnt: 283 },
  { month: 3, meta: 38500.00, realizado: 37181.07, anoAnterior: 15951.11, sazon: 5.7, invest: 781.82, units: 1497, unitsAnt: 532 },
  { month: 4, meta: 44000.00, realizado: 20838.05, anoAnterior: 14800.73, sazon: 5.3, invest: 2375.36, units: 699, unitsAnt: 496 },
  { month: 5, meta: 49500.00, realizado: 20258.27, anoAnterior: 20659.43, sazon: 7.4, invest: 3317.35, units: 687, unitsAnt: 728 },
  { month: 6, meta: 44000.00, realizado: 19827.04, anoAnterior: 20641.17, sazon: 7.4, invest: 2333.58, units: 557, unitsAnt: 692 },
  { month: 7, meta: 44000.00, realizado: 25043.05, anoAnterior: 33040.13, sazon: 11.9, invest: 2267.86, units: 757, unitsAnt: 1307 },
  { month: 8, meta: 49500.00, realizado: null, anoAnterior: 13237.75, sazon: 4.8, invest: null, units: null, unitsAnt: 498 },
  { month: 9, meta: 44000.00, realizado: null, anoAnterior: 27109.64, sazon: 9.7, invest: null, units: null, unitsAnt: 880 },
  { month: 10, meta: 49500.00, realizado: null, anoAnterior: 29745.87, sazon: 10.7, invest: null, units: null, unitsAnt: 904 },
  { month: 11, meta: 66000.00, realizado: null, anoAnterior: 47040.29, sazon: 16.9, invest: null, units: null, unitsAnt: 1457 },
  { month: 12, meta: 55000.00, realizado: null, anoAnterior: 23448.14, sazon: 8.4, invest: null, units: null, unitsAnt: 1045 },
];

const MELI = [
  { month: 1, meta: 351000.00, realizado: 410200.00, anoAnterior: 191440.00, sazon: 6.4, invest: 0.00 },
  { month: 2, meta: 351000.00, realizado: 341880.00, anoAnterior: 187690.00, sazon: 6.3, invest: 1538.54 },
  { month: 3, meta: 409500.00, realizado: 411590.00, anoAnterior: 133660.00, sazon: 4.5, invest: 2820.13 },
  { month: 4, meta: 468000.00, realizado: 443270.00, anoAnterior: 153300.00, sazon: 5.1, invest: 6666.31 },
  { month: 5, meta: 526500.00, realizado: 495280.00, anoAnterior: 150838.60, sazon: 5.1, invest: 11464.78 },
  { month: 6, meta: 468000.00, realizado: 452970.00, anoAnterior: 226454.56, sazon: 7.6, invest: 12765.08 },
  { month: 7, meta: 468000.00, realizado: null, anoAnterior: 283157.52, sazon: 9.5, invest: 9324.97 },
  { month: 8, meta: 526500.00, realizado: null, anoAnterior: 311692.44, sazon: 10.4, invest: null },
  { month: 9, meta: 468000.00, realizado: null, anoAnterior: 317500.00, sazon: 10.6, invest: null },
  { month: 10, meta: 526500.00, realizado: null, anoAnterior: 353720.00, sazon: 11.9, invest: null },
  { month: 11, meta: 702000.00, realizado: null, anoAnterior: 365550.00, sazon: 12.3, invest: null },
  { month: 12, meta: 585000.00, realizado: null, anoAnterior: 308680.00, sazon: 10.3, invest: null },
];

// Google/Meta: canais sem meta de receita (não têm venda de marketplace própria,
// só investimento — ver REVENUE_TRACKED em platforms/types.ts).
const GOOGLE_INVEST = { 1: 0.00, 2: 0.00, 3: 2107.09, 4: 2826.28, 5: 2374.49, 6: 4690.01, 7: 1258.58 };
const META_INVEST = { 1: 0.00, 2: 0.00, 3: 229.10, 4: 2267.86, 5: 1119.19, 6: 5883.13, 7: 1682.71 };

// Meta/realizado de receita ESPECIFICAMENTE atribuída a Ads (sub-conjunto do
// "geral" acima) — fonte: abas AMAZON / MERCADO LIVRE de
// "[MANN HUMMEL] METAS 2026.xlsx" ("PLANEJAMENTO MENSAL (RECEBIDO x GERADO) - ADS"),
// colunas Meta e Faturado. Pedido da Maria em 12/08: "adicionar as metas de
// ads e pace de ads" (Mercado Livre) e "o que está ali [na Amazon] é o geral,
// adicionar o de ads".
const AMAZON_ADS = [
  { month: 1, meta: 2952.30, realizado: 0.00 },
  { month: 2, meta: 2074.80, realizado: 0.00 },
  { month: 3, meta: 5352.10, realizado: 1292.99 },
  { month: 4, meta: 6065.94, realizado: 4776.21 },
  { month: 5, meta: 9462.84, realizado: 5167.21 },
  { month: 6, meta: 10119.34, realizado: 5601.72 },
  { month: 7, meta: 11549.34, realizado: 6344.99 },
  { month: 8, meta: 1800.64, realizado: 2398.37 },
  { month: 9, meta: 9910.04, realizado: null },
  { month: 10, meta: 8654.24, realizado: null },
  { month: 11, meta: 11896.44, realizado: null },
  { month: 12, meta: 8736.14, realizado: null },
];

const MELI_ADS = [
  { month: 1, meta: 19853.60, realizado: 0.00 },
  { month: 2, meta: 31882.50, realizado: 16413.00 },
  { month: 3, meta: 66778.40, realizado: 38195.48 },
  { month: 4, meta: 82568.04, realizado: 53533.90 },
  { month: 5, meta: 52431.44, realizado: 74928.36 },
  { month: 6, meta: 40501.34, realizado: 81475.63 },
  { month: 7, meta: 52990.44, realizado: 83596.40 },
  { month: 8, meta: 95939.84, realizado: 40292.39 },
  { month: 9, meta: 90574.74, realizado: null },
  { month: 10, meta: 99257.44, realizado: null },
  { month: 11, meta: 65531.54, realizado: null },
  { month: 12, meta: 58016.24, realizado: null },
];

function adsByMonth(rows) {
  return Object.fromEntries(rows.map((r) => [r.month, r]));
}

function upsert(channelId, rows, adsRows = []) {
  const ads = adsByMonth(adsRows);
  return Promise.all(
    rows.map((r) => {
      const a = ads[r.month] ?? {};
      return sql`
        INSERT INTO monthly_channel_metrics
          (channel_id, month, meta, realizado, receita_ano_anterior, sazonalidade, investimento, units, units_ano_anterior, ads_meta, ads_realizado, updated_at)
        VALUES
          (${channelId}, ${r.month}, ${r.meta}, ${r.realizado}, ${r.anoAnterior}, ${r.sazon}, ${r.invest}, ${r.units ?? null}, ${r.unitsAnt ?? null}, ${a.meta ?? null}, ${a.realizado ?? null}, now())
        ON CONFLICT (channel_id, month) DO UPDATE SET
          meta = EXCLUDED.meta,
          realizado = EXCLUDED.realizado,
          receita_ano_anterior = EXCLUDED.receita_ano_anterior,
          sazonalidade = EXCLUDED.sazonalidade,
          investimento = EXCLUDED.investimento,
          units = EXCLUDED.units,
          units_ano_anterior = EXCLUDED.units_ano_anterior,
          ads_meta = EXCLUDED.ads_meta,
          ads_realizado = EXCLUDED.ads_realizado,
          updated_at = now()
      `;
    }),
  );
}

function upsertInvestOnly(channelId, investByMonth) {
  return Promise.all(
    Object.entries(investByMonth).map(
      ([month, invest]) => sql`
        INSERT INTO monthly_channel_metrics (channel_id, month, investimento, updated_at)
        VALUES (${channelId}, ${Number(month)}, ${invest}, now())
        ON CONFLICT (channel_id, month) DO UPDATE SET
          investimento = EXCLUDED.investimento,
          updated_at = now()
      `,
    ),
  );
}

await upsert("amazon", AMAZON, AMAZON_ADS);
await upsert("meli", MELI, MELI_ADS);
await upsertInvestOnly("google", GOOGLE_INVEST);
await upsertInvestOnly("meta", META_INVEST);

console.log("Seed concluído: monthly_channel_metrics populada (amazon, meli, google, meta) — geral + ads.");
