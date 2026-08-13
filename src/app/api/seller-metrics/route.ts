import { NextResponse } from "next/server";
import { fetchSellerMonthly } from "@/lib/seller-metrics-store";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"];

export async function GET() {
  try {
    const rows = await fetchSellerMonthly();

    // Um revendedor pode ter mais de uma linha com o mesmo nome de exibição
    // (contas duplicadas na planilha) — agrupa por seller_id, não por nome.
    const bySeller = new Map<string, { revendedor: string; classificacao: string; sem2025: number; sem2026: number }>();
    const monthlyTotals = Array.from({ length: 7 }, (_, i) => ({ month: i + 1, total2025: 0, total2026: 0 }));

    for (const r of rows) {
      if (!bySeller.has(r.sellerId)) {
        bySeller.set(r.sellerId, { revendedor: r.revendedor, classificacao: r.classificacao, sem2025: 0, sem2026: 0 });
      }
      const s = bySeller.get(r.sellerId)!;
      // "Semestre" = Jan-Jun (bate com a aba Resumo/Revendedores da planilha,
      // que é a base do ranking de top sellers e participação) — Julho fica
      // só no gráfico mensal/trimestral, não entra aqui.
      if (r.month <= 6) {
        if (r.year === 2025) s.sem2025 += r.receita;
        if (r.year === 2026) s.sem2026 += r.receita;
      }

      const bucket = monthlyTotals[r.month - 1];
      if (bucket) {
        if (r.year === 2025) bucket.total2025 += r.receita;
        if (r.year === 2026) bucket.total2026 += r.receita;
      }
    }

    const sellers = Array.from(bySeller.values());
    const total2026 = sellers.reduce((sum, s) => sum + s.sem2026, 0);
    const total2025 = sellers.reduce((sum, s) => sum + s.sem2025, 0);

    const topSellers = [...sellers]
      .sort((a, b) => b.sem2026 - a.sem2026)
      .slice(0, 12)
      .map((s) => ({
        revendedor: s.revendedor,
        classificacao: s.classificacao,
        receita2026: s.sem2026,
        participacao: total2026 > 0 ? (s.sem2026 / total2026) * 100 : 0,
      }));

    const monthly = monthlyTotals.map((m) => ({
      label: MONTH_NAMES[m.month - 1],
      month: m.month,
      total2025: m.total2025,
      total2026: m.total2026,
    }));

    const quarterly = [
      {
        label: "Q1 (Jan-Mar)",
        total2025: monthlyTotals.slice(0, 3).reduce((s, m) => s + m.total2025, 0),
        total2026: monthlyTotals.slice(0, 3).reduce((s, m) => s + m.total2026, 0),
      },
      {
        label: "Q2 (Abr-Jun)",
        total2025: monthlyTotals.slice(3, 6).reduce((s, m) => s + m.total2025, 0),
        total2026: monthlyTotals.slice(3, 6).reduce((s, m) => s + m.total2026, 0),
      },
    ];

    const semestral = {
      total2025,
      total2026,
      crescimentoPct: total2025 > 0 ? ((total2026 - total2025) / total2025) * 100 : 0,
    };

    const antigos = sellers.filter((s) => s.classificacao === "Antigo");
    const novos = sellers.filter((s) => s.classificacao === "Novo");
    const baseComparativo = {
      antigos: { count: antigos.length, receita2026: antigos.reduce((s, x) => s + x.sem2026, 0) },
      novos: { count: novos.length, receita2026: novos.reduce((s, x) => s + x.sem2026, 0) },
    };

    return NextResponse.json({ monthly, quarterly, semestral, topSellers, baseComparativo, sellerCount: sellers.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar métricas de sellers";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
