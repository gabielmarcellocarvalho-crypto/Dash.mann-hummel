import { formatBRL2 } from "./format";
import type { CampaignRow, ChannelId, ChannelSummary } from "./platforms/types";

export type InsightDirection = "up" | "alert" | "arrow";
export type InsightSeverity = "imediato" | "urgente" | "esta-semana" | "90-dias";

export interface InsightItem {
  id: string;
  direction: InsightDirection;
  severity: InsightSeverity;
  title: string;
  body: string;
}

const SEVERITY_RANK: Record<InsightSeverity, number> = {
  imediato: 0,
  urgente: 1,
  "esta-semana": 2,
  "90-dias": 3,
};

function roasLabel(value: number): string {
  return `${value.toFixed(2).replace(".", ",")}x`;
}

// Gera insights só a partir do que dá pra provar com os dados reais do período/canais
// selecionados — nada de tendência histórica fabricada (não temos baseline salvo).
//
// IMPORTANTE: ROAS/ACOS só existem para canais com `revenueTracked === true`
// (hoje: MELI e Amazon, que reportam vendas reais). Google e Meta não têm
// evento de compra com valor mapeado configurado nesta conta — comparar
// performance por ROAS pra eles seria comparar dinheiro com contagem de
// clique, e classificaria como "ruim" um canal que só não tem rastreamento.
export function generateInsights(
  summaries: ChannelSummary[],
  campaigns: CampaignRow[],
  channelNames: Record<ChannelId, string>,
  periodLabel: string,
): InsightItem[] {
  const items: InsightItem[] = [];
  const withRevenue = summaries.filter((s) => s.revenueTracked && s.investimento > 0);
  const withoutRevenue = summaries.filter((s) => !s.revenueTracked && s.investimento > 0);

  const bestRoas = [...withRevenue].sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0))[0];
  if (bestRoas && (bestRoas.roas ?? 0) > 0) {
    items.push({
      id: "best-roas",
      direction: "up",
      severity: "imediato",
      title: `${channelNames[bestRoas.channelId]} com o melhor ROAS do período (${roasLabel(bestRoas.roas!)})`,
      body: `Nos últimos ${periodLabel}, ${channelNames[bestRoas.channelId]} teve ROAS de ${roasLabel(bestRoas.roas!)} — investimento de ${formatBRL2(bestRoas.investimento)} gerou ${formatBRL2(bestRoas.receita)} em receita atribuída.`,
    });
  }

  withRevenue
    .filter((s) => (s.roas ?? 0) < 1 && s.investimento > 50)
    .sort((a, b) => (a.roas ?? 0) - (b.roas ?? 0))
    .forEach((s) => {
      items.push({
        id: `loss-${s.channelId}`,
        direction: "alert",
        severity: "urgente",
        title: `${channelNames[s.channelId]} gastando mais do que retorna (ROAS ${roasLabel(s.roas ?? 0)})`,
        body: `Investimento de ${formatBRL2(s.investimento)} nos últimos ${periodLabel} gerou apenas ${formatBRL2(s.receita)} em receita atribuída. Vale revisar campanhas e lances antes de manter o mesmo ritmo de gasto.`,
      });
    });

  campaigns
    .filter((c) => c.revenueTracked && c.cost > 50 && c.revenue === 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 3)
    .forEach((c) => {
      items.push({
        id: `waste-${c.channelId}-${c.campaignId}`,
        direction: "alert",
        severity: "esta-semana",
        title: `Campanha "${c.campaign}" (${channelNames[c.channelId]}) sem retorno registrado`,
        body: `${formatBRL2(c.cost)} investidos nos últimos ${periodLabel} sem nenhuma receita atribuída registrada nessa campanha. Pausar ou revisar segmentação é recomendado.`,
      });
    });

  const totalInvestimentoComReceita = withRevenue.reduce((sum, s) => sum + s.investimento, 0);
  const topBudget = [...withRevenue].sort((a, b) => b.investimento - a.investimento)[0];
  if (topBudget && totalInvestimentoComReceita > 0 && withRevenue.length > 1) {
    const share = topBudget.investimento / totalInvestimentoComReceita;
    if (share > 0.4) {
      items.push({
        id: "budget-concentration",
        direction: "arrow",
        severity: "90-dias",
        title: `${channelNames[topBudget.channelId]} concentra ${(share * 100).toFixed(0)}% do budget com receita rastreada`,
        body: `Com ROAS de ${roasLabel(topBudget.roas ?? 0)} no período, vale monitorar se essa concentração de investimento é a melhor alocação frente aos demais canais com receita rastreada.`,
      });
    }
  }

  // Google e Meta aqui atuam como topo de funil, levando tráfego para o
  // Mercado Livre e a Amazon, que fecham a venda — por isso não têm receita
  // própria atribuída nesta conta. Isso não é um problema de performance,
  // então o insight foca no que dá pra medir de verdade: volume de cliques,
  // CTR e eficiência de custo por clique gerando tráfego para os marketplaces.
  withoutRevenue
    .filter((s) => s.cliques > 0)
    .sort((a, b) => b.cliques - a.cliques)
    .forEach((s) => {
      items.push({
        id: `traffic-${s.channelId}`,
        direction: "up",
        severity: "esta-semana",
        title: `${channelNames[s.channelId]} gerou ${s.cliques.toLocaleString("pt-BR")} cliques (CTR ${(s.ctr * 100).toFixed(2).replace(".", ",")}%) nos últimos ${periodLabel}`,
        body: `Investimento de ${formatBRL2(s.investimento)} trouxe ${s.cliques.toLocaleString("pt-BR")} cliques com CPC médio de ${formatBRL2(s.cpc)}, direcionando tráfego para Mercado Livre e Amazon — onde a venda é fechada e medida nos canais de marketplace.`,
      });
    });

  if (items.length === 0) {
    items.push({
      id: "no-data",
      direction: "arrow",
      severity: "90-dias",
      title: "Sem dados suficientes para gerar insights no período selecionado",
      body: "Amplie o período ou selecione outros canais para gerar análises.",
    });
  }

  return items.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}
