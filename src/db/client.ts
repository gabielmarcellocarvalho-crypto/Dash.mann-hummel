import { neon } from "@neondatabase/serverless";

// Inicialização preguiçosa: `neon()` lança se DATABASE_URL não existir, e o
// Next.js avalia módulos de nível superior durante o build — instanciar aqui
// direto quebraria `next build` antes das env vars da Vercel existirem.
let _sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL não configurada");
    _sql = neon(url);
  }
  return _sql;
}
