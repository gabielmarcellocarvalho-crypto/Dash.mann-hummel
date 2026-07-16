import { upsertEnvVar } from "@/lib/env-store";
import { summarizeCampaigns, type CampaignRow, type ChannelSummary, type DailyPoint, type DateRange } from "./types";

const API_VERSION = "v24";

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: CachedToken | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Credenciais GOOGLE_ADS_CLIENT_ID/GOOGLE_ADS_CLIENT_SECRET/GOOGLE_ADS_REFRESH_TOKEN ausentes");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`Google Ads: falha ao renovar token — ${json.error_description ?? res.status}`);
  }

  // O refresh_token de contas Google não é rotacionado neste fluxo, mas
  // persistimos de qualquer forma caso o Google devolva um novo no futuro.
  if (json.refresh_token) {
    upsertEnvVar("GOOGLE_ADS_REFRESH_TOKEN", json.refresh_token);
  }

  tokenCache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in - 120) * 1000,
  };

  return json.access_token;
}

interface RawGoogleAdsRow {
  campaign: { id: string; name: string; status: string };
  metrics: {
    clicks?: string;
    impressions?: string;
    costMicros?: string;
    ctr?: number;
    averageCpc?: number;
    conversions?: number;
    conversionsValue?: number;
  };
}

function mapRow(row: RawGoogleAdsRow): CampaignRow {
  const m = row.metrics;
  const cost = m.costMicros ? Number(m.costMicros) / 1_000_000 : 0;
  const clicks = m.clicks ? Number(m.clicks) : 0;

  // As conversion actions cadastradas nesta conta (cliques em botão de
  // marketplace, pageview, "Contato") têm valor fixo de R$1 por conversão —
  // metrics.conversions_value NÃO é receita real, é contagem de clique
  // disfarçada de dinheiro. Exibir isso como ROAS/receita enganaria o
  // cliente sobre a performance real do canal, então zeramos aqui.
  return {
    channelId: "google",
    campaignId: row.campaign.id,
    campaign: row.campaign.name,
    status: row.campaign.status,
    budget: null, // requer join com campaign_budget; fora de escopo por ora
    clicks,
    impressions: m.impressions ? Number(m.impressions) : 0,
    cost,
    cpc: m.averageCpc ? m.averageCpc / 1_000_000 : null,
    ctr: m.ctr ?? null,
    revenue: 0,
    roas: null,
    acos: null,
    revenueTracked: false,
    units: 0,
  };
}

export async function fetchGoogleAdsCampaigns(range: DateRange): Promise<CampaignRow[]> {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!customerId || !developerToken) {
    throw new Error("GOOGLE_ADS_CUSTOMER_ID/GOOGLE_ADS_DEVELOPER_TOKEN não configurados");
  }

  const accessToken = await getAccessToken();
  const { dateFrom, dateTo } = range;

  const query = `
    SELECT campaign.id, campaign.name, campaign.status,
           metrics.impressions, metrics.clicks, metrics.cost_micros,
           metrics.ctr, metrics.average_cpc, metrics.conversions, metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
    ORDER BY metrics.cost_micros DESC
  `;

  const res = await fetch(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      ...(loginCustomerId ? { "login-customer-id": loginCustomerId } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok) {
    const message = Array.isArray(json) ? json[0]?.error?.message : json.error?.message;
    throw new Error(`Google Ads: ${message ?? res.status}`);
  }

  const results: RawGoogleAdsRow[] = json.results ?? [];
  return results.map(mapRow);
}

export function summarizeGoogleAds(campaigns: CampaignRow[]): ChannelSummary {
  return summarizeCampaigns("google", campaigns);
}

interface RawGoogleAdsDailyRow {
  segments: { date: string };
  metrics: { clicks?: string; impressions?: string; costMicros?: string };
}

export async function fetchGoogleAdsDailySeries(range: DateRange): Promise<DailyPoint[]> {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!customerId || !developerToken) {
    throw new Error("GOOGLE_ADS_CUSTOMER_ID/GOOGLE_ADS_DEVELOPER_TOKEN não configurados");
  }

  const accessToken = await getAccessToken();

  // Sem campaign.id no SELECT: cada linha ainda vem por campanha internamente,
  // então agregamos por data no cliente pra ter o total do canal por dia.
  const query = `
    SELECT segments.date, metrics.clicks, metrics.impressions, metrics.cost_micros
    FROM campaign
    WHERE segments.date BETWEEN '${range.dateFrom}' AND '${range.dateTo}'
  `;

  const res = await fetch(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      ...(loginCustomerId ? { "login-customer-id": loginCustomerId } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok) {
    const message = Array.isArray(json) ? json[0]?.error?.message : json.error?.message;
    throw new Error(`Google Ads: ${message ?? res.status}`);
  }

  const results: RawGoogleAdsDailyRow[] = json.results ?? [];
  const byDate = new Map<string, DailyPoint>();
  for (const row of results) {
    const date = row.segments.date;
    const existing = byDate.get(date) ?? { date, cost: 0, clicks: 0, impressions: 0, revenue: 0 };
    existing.cost += row.metrics.costMicros ? Number(row.metrics.costMicros) / 1_000_000 : 0;
    existing.clicks += row.metrics.clicks ? Number(row.metrics.clicks) : 0;
    existing.impressions += row.metrics.impressions ? Number(row.metrics.impressions) : 0;
    byDate.set(date, existing);
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
