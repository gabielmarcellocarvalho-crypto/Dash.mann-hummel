// Importa Glance Views (visualizações de página de oferta) da Amazon Vendor.
// Fonte: "Mann_Hummel_2026.xlsx" (aba Glance Views), enviada pela Maria em
// 12/08 — só fecha mensal (a Amazon não entrega isso dia a dia).
// Rodar de novo quando a planilha for atualizada:
//   npx dotenv -e .env.local -- node scripts/seed-vendor-metrics.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS amazon_glance_views (
    month INTEGER PRIMARY KEY,
    views_2025 INTEGER,
    views_2026 INTEGER,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

const ROWS = [
  { month: 1, v25: 5975, v26: 17594 },
  { month: 2, v25: 5233, v26: 14481 },
  { month: 3, v25: 9687, v26: 20596 },
  { month: 4, v25: 8853, v26: 14789 },
  { month: 5, v25: 12897, v26: 15696 },
  { month: 6, v25: 14802, v26: 16796 },
  { month: 7, v25: 24617, v26: 10975 },
];

await Promise.all(
  ROWS.map(
    (r) => sql`
      INSERT INTO amazon_glance_views (month, views_2025, views_2026, updated_at)
      VALUES (${r.month}, ${r.v25}, ${r.v26}, now())
      ON CONFLICT (month) DO UPDATE SET
        views_2025 = EXCLUDED.views_2025, views_2026 = EXCLUDED.views_2026, updated_at = now()
    `,
  ),
);

console.log("Seed concluído: amazon_glance_views populada (Jan-Jul, 2025 vs 2026).");
