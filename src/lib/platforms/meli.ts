import { upsertEnvVar } from "@/lib/env-store";
import { summarizeCampaigns, type CampaignRow, type ChannelSummary, type DailyPoint, type DateRange } from "./types";

const METRICS = [
  "clicks",
  "prints",
  "cost",
  "cpc",
  "ctr",
  "acos",
  "roas",
  "direct_amount",
  "indirect_amount",
  "total_amount",
  "direct_units_quantity",
  "indirect_units_quantity",
  "units_quantity",
].join(",");

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

let tokenCache: CachedToken | null = null;

async function refreshAccessToken(): Promise<string> {
  const clientId = process.env.MELI_CLIENT_ID;
  const clientSecret = process.env.MELI_CLIENT_SECRET;
  const refreshToken = process.env.MELI_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Credenciais MELI_CLIENT_ID/MELI_CLIENT_SECRET/MELI_REFRESH_TOKEN ausentes");
  }

  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`MELI: falha ao renovar token — ${json.message ?? res.status}`);
  }

  // O refresh_token do MELI é de uso único: o novo precisa ser persistido
  // imediatamente, senão a próxima renovação falha com invalid_grant.
  upsertEnvVar("MELI_REFRESH_TOKEN", json.refresh_token);
  upsertEnvVar("MELI_ACCESS_TOKEN", json.access_token);

  tokenCache = {
    accessToken: json.access_token,
    // margem de 5 min antes do vencimento real (~6h)
    expiresAt: Date.now() + (json.expires_in - 300) * 1000,
  };

  return json.access_token;
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }
  return refreshAccessToken();
}

interface RawMeliCampaign {
  id: number;
  name: string;
  status: string;
  budget: number;
  metrics?: {
    clicks: number;
    prints: number;
    cost: number;
    cpc: number;
    ctr: number;
    acos: number;
    roas: number;
    total_amount: number;
    units_quantity: number;
  };
}

function mapCampaign(row: RawMeliCampaign): CampaignRow {
  const m = row.metrics;
  return {
    channelId: "meli",
    campaignId: String(row.id),
    campaign: row.name,
    status: row.status,
    budget: row.budget ?? null,
    clicks: m?.clicks ?? 0,
    impressions: m?.prints ?? 0,
    cost: m?.cost ?? 0,
    cpc: m?.cpc ?? null,
    ctr: m ? m.ctr / 100 : null, // MELI retorna ctr em pontos percentuais (0.08 = 0,08%)
    revenue: m?.total_amount ?? 0,
    roas: m?.roas ?? null,
    acos: m ? m.acos / 100 : null,
    revenueTracked: true, // receita vem de vendas reais atribuídas pelo MELI
    units: m?.units_quantity ?? 0,
  };
}

async function fetchCampaignsOnce(range: DateRange): Promise<CampaignRow[]> {
  const advertiserId = process.env.MELI_ADVERTISER_ID;
  if (!advertiserId) throw new Error("MELI_ADVERTISER_ID não configurado");

  const accessToken = await getAccessToken();
  const { dateFrom, dateTo } = range;

  const url = new URL(
    `https://api.mercadolibre.com/marketplace/advertising/MLB/advertisers/${advertiserId}/product_ads/campaigns/search`,
  );
  url.searchParams.set("date_from", dateFrom);
  url.searchParams.set("date_to", dateTo);
  url.searchParams.set("metrics", METRICS);
  url.searchParams.set("limit", "50");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}`, "Api-Version": "2" },
    cache: "no-store",
  });

  if (res.status === 401) {
    tokenCache = null;
    throw new Error("MELI: token inválido mesmo após renovação");
  }

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`MELI: ${json.message ?? res.status}`);
  }

  const results: RawMeliCampaign[] = json.results ?? [];
  return results.map(mapCampaign);
}

export async function fetchMeliCampaigns(range: DateRange): Promise<CampaignRow[]> {
  try {
    return await fetchCampaignsOnce(range);
  } catch (error) {
    // token pode ter expirado entre a checagem de cache e a chamada — 1 retry após forçar refresh
    if (error instanceof Error && error.message.includes("token inválido")) {
      return fetchCampaignsOnce(range);
    }
    throw error;
  }
}

export function summarizeMeli(campaigns: CampaignRow[]): ChannelSummary {
  return summarizeCampaigns("meli", campaigns);
}

interface RawMeliDailyRow {
  date: string;
  clicks: number;
  prints: number;
  cost: number;
  total_amount: number;
}

export async function fetchMeliDailySeries(range: DateRange): Promise<DailyPoint[]> {
  const advertiserId = process.env.MELI_ADVERTISER_ID;
  if (!advertiserId) throw new Error("MELI_ADVERTISER_ID não configurado");

  const accessToken = await getAccessToken();

  const url = new URL(
    `https://api.mercadolibre.com/marketplace/advertising/MLB/advertisers/${advertiserId}/product_ads/campaigns/search`,
  );
  url.searchParams.set("date_from", range.dateFrom);
  url.searchParams.set("date_to", range.dateTo);
  url.searchParams.set("metrics", "clicks,prints,cost,total_amount");
  url.searchParams.set("metrics_summary", "false");
  url.searchParams.set("aggregation_type", "daily");
  url.searchParams.set("limit", "100");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}`, "Api-Version": "2" },
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`MELI: ${json.message ?? res.status}`);
  }

  const results: RawMeliDailyRow[] = json.results ?? [];
  return results.map((r) => ({
    date: r.date,
    cost: r.cost ?? 0,
    clicks: r.clicks ?? 0,
    impressions: r.prints ?? 0,
    revenue: r.total_amount ?? 0,
  }));
}
