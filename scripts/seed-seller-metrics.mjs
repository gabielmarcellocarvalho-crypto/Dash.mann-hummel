// Importa os dados reais de revendedores (sellers) do Mercado Livre pro banco.
// Fonte: "Mann_Hummel_2026.xlsx" (aba Dados), enviada pela Maria em 12/08 —
// alimentado manualmente mês a mês (não existe API de revendedor).
// Rodar de novo quando a planilha for atualizada:
//   npx dotenv -e .env.local -- node scripts/seed-seller-metrics.mjs
import { neon } from "@neondatabase/serverless";
import { SELLERS } from "./seed-seller-metrics.data.mjs";

const sql = neon(process.env.DATABASE_URL);

await sql`
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
`;

let count = 0;
for (const seller of SELLERS) {
  for (const [month, [v2025, v2026]] of Object.entries(seller.m)) {
    await sql`
      INSERT INTO ml_seller_monthly (seller_id, revendedor, classificacao, month, year, receita, updated_at)
      VALUES (${seller.id}, ${seller.name}, ${seller.classif}, ${Number(month)}, 2025, ${v2025}, now())
      ON CONFLICT (seller_id, month, year) DO UPDATE SET
        revendedor = EXCLUDED.revendedor, classificacao = EXCLUDED.classificacao, receita = EXCLUDED.receita, updated_at = now()
    `;
    await sql`
      INSERT INTO ml_seller_monthly (seller_id, revendedor, classificacao, month, year, receita, updated_at)
      VALUES (${seller.id}, ${seller.name}, ${seller.classif}, ${Number(month)}, 2026, ${v2026}, now())
      ON CONFLICT (seller_id, month, year) DO UPDATE SET
        revendedor = EXCLUDED.revendedor, classificacao = EXCLUDED.classificacao, receita = EXCLUDED.receita, updated_at = now()
    `;
    count += 2;
  }
}

console.log(`Seed concluído: ml_seller_monthly populada (${SELLERS.length} sellers, ${count} linhas mensais).`);
