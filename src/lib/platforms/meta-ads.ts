import { summarizeCampaigns, type CampaignRow, type ChannelSummary, type DailyPoint, type DateRange } from "./types";

const API_VERSION = "v21.0";

// Ordem de prioridade para identificar o valor de "compra" dentro de action_values
// (a Meta retorna dezenas de action_types; nem toda conta usa o mesmo pixel/evento).
const PURCHASE_ACTION_TYPES = ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"];

interface RawInsightRow {
  campaign_id: string;
  campaign_name: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
}

interface RawCampaignMeta {
  id: string;
  name: string;
  status: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

function extractRevenue(row: RawInsightRow): number {
  if (!row.action_values) return 0;
  for (const type of PURCHASE_ACTION_TYPES) {
    const match = row.action_values.find((a) => a.action_type === type);
    if (match) return Number(match.value);
  }
  return 0;
}

async function fetchInsights(adAccountId: string, accessToken: string, range: DateRange): Promise<RawInsightRow[]> {
  const url = new URL(`https://graph.facebook.com/${API_VERSION}/act_${adAccountId}/insights`);
  url.searchParams.set("level", "campaign");
  url.searchParams.set("time_range", JSON.stringify({ since: range.dateFrom, until: range.dateTo }));
  url.searchParams.set(
    "fields",
    "campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,actions,action_values",
  );
  url.searchParams.set("limit", "200");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Meta Ads: ${json.error?.message ?? res.status}`);
  }
  return json.data ?? [];
}

async function fetchCampaignMeta(adAccountId: string, accessToken: string): Promise<Map<string, RawCampaignMeta>> {
  const url = new URL(`https://graph.facebook.com/${API_VERSION}/act_${adAccountId}/campaigns`);
  url.searchParams.set("fields", "id,name,status,daily_budget,lifetime_budget");
  url.searchParams.set("limit", "500");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Meta Ads (campaigns): ${json.error?.message ?? res.status}`);
  }
  const rows: RawCampaignMeta[] = json.data ?? [];
  return new Map(rows.map((r) => [r.id, r]));
}

export async function fetchMetaAdsCampaigns(range: DateRange): Promise<CampaignRow[]> {
  const adAccountId = process.env.META_AD_ACCOUNT_ID?.replace(/^act_/, "");
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!adAccountId || !accessToken) {
    throw new Error("META_AD_ACCOUNT_ID/META_ACCESS_TOKEN não configurados");
  }

  const [insights, campaignMeta] = await Promise.all([
    fetchInsights(adAccountId, accessToken, range),
    fetchCampaignMeta(adAccountId, accessToken),
  ]);

  return insights.map((row) => {
    const meta = campaignMeta.get(row.campaign_id);
    const cost = row.spend ? Number(row.spend) : 0;
    // Verificado via API (90 dias, todas as campanhas): action_values e
    // purchase_roas vêm vazios em 100% dos casos — não há evento de compra
    // com valor mapeado no Pixel/CAPI desta conta. extractRevenue() é
    // mantido só de fallback caso isso mude no futuro, mas revenueTracked
    // segue a decisão de conta em REVENUE_TRACKED (types.ts), não um valor
    // pontual de uma campanha isolada.
    const revenue = extractRevenue(row);
    const budgetCents = meta?.daily_budget ?? meta?.lifetime_budget;

    return {
      channelId: "meta",
      campaignId: row.campaign_id,
      campaign: row.campaign_name,
      status: meta?.status ?? null,
      budget: budgetCents ? Number(budgetCents) / 100 : null,
      clicks: row.clicks ? Number(row.clicks) : 0,
      impressions: row.impressions ? Number(row.impressions) : 0,
      cost,
      cpc: row.cpc ? Number(row.cpc) : null,
      ctr: row.ctr ? Number(row.ctr) / 100 : null, // Meta retorna ctr em pontos percentuais
      revenue,
      roas: null,
      acos: null,
      revenueTracked: false,
      units: 0,
    } satisfies CampaignRow;
  });
}

export function summarizeMetaAds(campaigns: CampaignRow[]): ChannelSummary {
  return summarizeCampaigns("meta", campaigns);
}

interface RawMetaDailyRow {
  date_start: string;
  spend?: string;
  clicks?: string;
  impressions?: string;
}

export async function fetchMetaAdsDailySeries(range: DateRange): Promise<DailyPoint[]> {
  const adAccountId = process.env.META_AD_ACCOUNT_ID?.replace(/^act_/, "");
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!adAccountId || !accessToken) {
    throw new Error("META_AD_ACCOUNT_ID/META_ACCESS_TOKEN não configurados");
  }

  const url = new URL(`https://graph.facebook.com/${API_VERSION}/act_${adAccountId}/insights`);
  url.searchParams.set("level", "account");
  url.searchParams.set("time_range", JSON.stringify({ since: range.dateFrom, until: range.dateTo }));
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("fields", "spend,clicks,impressions");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Meta Ads: ${json.error?.message ?? res.status}`);
  }

  const results: RawMetaDailyRow[] = json.data ?? [];
  return results.map((r) => ({
    date: r.date_start,
    cost: r.spend ? Number(r.spend) : 0,
    clicks: r.clicks ? Number(r.clicks) : 0,
    impressions: r.impressions ? Number(r.impressions) : 0,
    revenue: 0, // Meta não tem receita rastreada nesta conta (ver REVENUE_TRACKED)
  }));
}
