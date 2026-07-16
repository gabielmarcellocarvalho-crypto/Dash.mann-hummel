import type { ChannelId } from "@/data/mock-dashboard";

export type { ChannelId };

export type Period = "7d" | "14d" | "30d" | "90d";

export const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: "7d", label: "7 dias" },
  { id: "14d", label: "14 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
];

export interface DateRange {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  cost: number;
  clicks: number;
  impressions: number;
  revenue: number; // 0 quando o canal não tem revenueTracked
}

// Nem toda plataforma tem rastreamento real de valor de conversão configurado
// nesta conta. Verificado via API em 2026-07:
// - MELI e Amazon: receita vem de dados reais de pedido/venda do marketplace.
// - Google Ads: as conversion actions cadastradas são cliques/pageviews com
//   valor fixo (defaultValue=1) — "conversions_value" não é dinheiro real.
// - Meta Ads: nenhuma campanha tem action_values/purchase_roas em 90 dias —
//   não há evento de compra com valor mapeado no Pixel/CAPI. Ambos operam
//   como topo de funil, levando tráfego para MELI/Amazon, que fecham a venda.
// Enquanto isso não for corrigido na conta do cliente, ROAS/ACOS/receita
// dessas duas plataformas não são exibidos como número — só "sem rastreamento".
export const REVENUE_TRACKED: Record<ChannelId, boolean> = {
  meli: true,
  amazon: true,
  google: false,
  meta: false,
};

export interface CampaignRow {
  channelId: ChannelId;
  campaignId: string;
  campaign: string;
  status: string | null;
  budget: number | null;
  clicks: number;
  impressions: number;
  cost: number;
  cpc: number | null;
  ctr: number | null; // fração 0-1
  revenue: number;
  roas: number | null;
  acos: number | null; // fração 0-1
  revenueTracked: boolean;
  units: number; // unidades vendidas atribuídas — só > 0 quando revenueTracked
}

export interface ChannelSummary {
  channelId: ChannelId;
  investimento: number;
  receita: number;
  cliques: number;
  impressoes: number;
  ctr: number;
  cpc: number;
  roas: number | null;
  acos: number | null;
  campanhasAtivas: number;
  totalCampanhas: number;
  revenueTracked: boolean;
  units: number;
}

export function summarizeCampaigns(channelId: ChannelId, campaigns: CampaignRow[]): ChannelSummary {
  const revenueTracked = REVENUE_TRACKED[channelId];
  const investimento = campaigns.reduce((sum, c) => sum + c.cost, 0);
  const receita = revenueTracked ? campaigns.reduce((sum, c) => sum + c.revenue, 0) : 0;
  const cliques = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const impressoes = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const units = revenueTracked ? campaigns.reduce((sum, c) => sum + c.units, 0) : 0;
  const ativoStatuses = new Set(["ENABLED", "ACTIVE"]);
  const campanhasAtivas = campaigns.filter((c) => c.status && ativoStatuses.has(c.status.toUpperCase())).length;

  return {
    channelId,
    investimento,
    receita,
    cliques,
    impressoes,
    ctr: impressoes > 0 ? cliques / impressoes : 0,
    cpc: cliques > 0 ? investimento / cliques : 0,
    roas: revenueTracked && investimento > 0 ? receita / investimento : null,
    acos: revenueTracked && receita > 0 ? investimento / receita : null,
    campanhasAtivas,
    totalCampanhas: campaigns.length,
    revenueTracked,
    units,
  };
}
