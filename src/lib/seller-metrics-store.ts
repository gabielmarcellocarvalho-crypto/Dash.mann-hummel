import { getSql } from "@/db/client";

// Sellers/revendedores do Mercado Livre — fonte real: planilha "Mann_Hummel_2026.xlsx"
// (aba Dados), enviada pela Maria em 12/08 e importada uma vez via
// scripts/seed-seller-metrics.mjs. Alimentado manualmente mês a mês (não tem
// API de revendedor) — a aba "Sellers Mercado Livre" lê daqui.
export interface SellerMonthlyRow {
  sellerId: string;
  revendedor: string;
  classificacao: "Antigo" | "Novo";
  month: number; // 1-12
  year: number;
  receita: number;
}

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const sql = getSql();
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS ml_seller_monthly (
        seller_id TEXT NOT NULL,
        revendedor TEXT NOT NULL,
        classificacao TEXT NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        receita NUMERIC NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (seller_id, month, year)
      )
    `.then(() => undefined);
  }
  return schemaReady;
}

export async function upsertSellerMonthly(rows: SellerMonthlyRow[]): Promise<void> {
  if (rows.length === 0) return;
  await ensureSchema();
  const sql = getSql();

  for (const r of rows) {
    await sql`
      INSERT INTO ml_seller_monthly (seller_id, revendedor, classificacao, month, year, receita, updated_at)
      VALUES (${r.sellerId}, ${r.revendedor}, ${r.classificacao}, ${r.month}, ${r.year}, ${r.receita}, now())
      ON CONFLICT (seller_id, month, year) DO UPDATE SET
        revendedor = EXCLUDED.revendedor,
        classificacao = EXCLUDED.classificacao,
        receita = EXCLUDED.receita,
        updated_at = now()
    `;
  }
}

export async function fetchSellerMonthly(): Promise<SellerMonthlyRow[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT seller_id, revendedor, classificacao, month, year, receita
    FROM ml_seller_monthly
    ORDER BY revendedor ASC, year ASC, month ASC
  `) as Record<string, unknown>[];

  return rows.map((r) => ({
    sellerId: String(r.seller_id),
    revendedor: String(r.revendedor),
    classificacao: r.classificacao as "Antigo" | "Novo",
    month: Number(r.month),
    year: Number(r.year),
    receita: Number(r.receita),
  }));
}
