import { getSql } from "@/db/client";

// Amazon Vendor — Glance Views (visualizações da página de oferta por ASIN).
// A Amazon só entrega isso fechado por mês (não dá pra puxar dia a dia — ver
// reunião de 12/08), então fica numa tabela separada, alimentada manualmente
// via scripts/seed-vendor-metrics.mjs sempre que a Maria mandar planilha nova.
export interface VendorGlanceViewsRow {
  month: number; // 1-12
  views2025: number | null;
  views2026: number | null;
}

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const sql = getSql();
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS amazon_glance_views (
        month INTEGER PRIMARY KEY,
        views_2025 INTEGER,
        views_2026 INTEGER,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `.then(() => undefined);
  }
  return schemaReady;
}

export async function upsertGlanceViews(rows: VendorGlanceViewsRow[]): Promise<void> {
  if (rows.length === 0) return;
  await ensureSchema();
  const sql = getSql();
  for (const r of rows) {
    await sql`
      INSERT INTO amazon_glance_views (month, views_2025, views_2026, updated_at)
      VALUES (${r.month}, ${r.views2025}, ${r.views2026}, now())
      ON CONFLICT (month) DO UPDATE SET
        views_2025 = EXCLUDED.views_2025,
        views_2026 = EXCLUDED.views_2026,
        updated_at = now()
    `;
  }
}

export async function fetchGlanceViews(): Promise<VendorGlanceViewsRow[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT month, views_2025, views_2026 FROM amazon_glance_views ORDER BY month ASC
  `) as Record<string, unknown>[];

  return rows.map((r) => ({
    month: Number(r.month),
    views2025: r.views_2025 === null ? null : Number(r.views_2025),
    views2026: r.views_2026 === null ? null : Number(r.views_2026),
  }));
}
