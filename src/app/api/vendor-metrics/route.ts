import { NextResponse } from "next/server";
import { fetchGlanceViews } from "@/lib/vendor-metrics-store";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export async function GET() {
  try {
    const rows = await fetchGlanceViews();
    const glanceViews = rows.map((r) => ({ label: MONTH_NAMES[r.month - 1], ...r }));

    // Top Produtos depende de acesso à Amazon Vendor Central (login Seller
    // Central atual não puxa isso — ver reunião de 12/08: API oficial foi
    // recusada, aguardando reenvio de documentos). Fica vazio até a conexão
    // existir; o front mostra um estado de espera em vez de inventar dado.
    const topProducts: { sku: string; nome: string; receita: number; unidades: number }[] = [];

    return NextResponse.json({ glanceViews, topProducts, topProductsConnected: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar métricas do Vendor";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
