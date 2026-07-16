// Integração Amazon Ads via Windsor.ai — a API nativa da Amazon Advertising
// foi reprovada para esta conta, então os dados vêm por esse conector.
// Onde gerenciar a conexão: https://onboarding.windsor.ai

const AMAZON_FIELD_NAMES = [
  "acos",
  "adnetwork_conversions",
  "adnetwork_revenue",
  "attributedconversions14d",
  "attributedconversions1d",
  "attributedconversions30d",
  "attributedconversions7d",
  "attributedsales14d",
  "attributedsales1d",
  "attributedsales30d",
  "attributedsales7d",
  "attributedunitsordered14d",
  "attributedunitsordered1d",
  "attributedunitsordered30d",
  "attributedunitsordered7d",
  "campaign",
  "campaign_budget",
  "campaign_status",
  "campaignbiddingstrategy",
  "campaigndailybudget",
  "campaignid",
  "campaigntargetingtype",
  "clicks",
  "cost",
  "cpc",
  "ctr",
  "impressions",
  "portfolio_id",
  "portfolio_name",
  "roas",
  "spend",
  "totalcost",
] as const;

const AMAZON_FIELDS = AMAZON_FIELD_NAMES.map((f) => `sponsored_products_campaign__${f}`);

export interface AmazonAdsCampaign {
  campaign: string;
  campaignId: string;
  status: string | null;
  budget: number | null;
  dailyBudget: number | null;
  biddingStrategy: string | null;
  targetingType: string | null;
  portfolioId: string | null;
  portfolioName: string | null;
  clicks: number;
  impressions: number;
  cost: number;
  cpc: number | null;
  ctr: number | null;
  roas: number | null;
  acos: number | null;
  attributedSales7d: number;
  attributedSales30d: number;
  attributedConversions7d: number;
  attributedConversions30d: number;
  attributedUnitsOrdered30d: number;
}

export interface AmazonAdsSummary {
  investimento: number;
  cliques: number;
  impressoes: number;
  vendas30d: number;
  ctr: number;
  cpc: number;
  roas: number;
  acos: number;
  campanhasAtivas: number;
  totalCampanhas: number;
}

type RawRow = Record<string, string | number | null>;

function num(row: RawRow, key: string): number {
  const value = row[`sponsored_products_campaign__${key}`];
  return typeof value === "number" ? value : 0;
}

function numOrNull(row: RawRow, key: string): number | null {
  const value = row[`sponsored_products_campaign__${key}`];
  return typeof value === "number" ? value : null;
}

function str(row: RawRow, key: string): string | null {
  const value = row[`sponsored_products_campaign__${key}`];
  return value === null || value === undefined ? null : String(value);
}

function mapCampaign(row: RawRow): AmazonAdsCampaign {
  return {
    campaign: str(row, "campaign") ?? "(sem nome)",
    campaignId: str(row, "campaignid") ?? "",
    status: str(row, "campaign_status"),
    budget: numOrNull(row, "campaign_budget"),
    dailyBudget: numOrNull(row, "campaigndailybudget"),
    biddingStrategy: str(row, "campaignbiddingstrategy"),
    targetingType: str(row, "campaigntargetingtype"),
    portfolioId: str(row, "portfolio_id"),
    portfolioName: str(row, "portfolio_name"),
    clicks: num(row, "clicks"),
    impressions: num(row, "impressions"),
    cost: num(row, "cost"),
    cpc: numOrNull(row, "cpc"),
    ctr: numOrNull(row, "ctr"),
    roas: numOrNull(row, "roas"),
    acos: numOrNull(row, "acos"),
    attributedSales7d: num(row, "attributedsales7d"),
    attributedSales30d: num(row, "attributedsales30d"),
    attributedConversions7d: num(row, "attributedconversions7d"),
    attributedConversions30d: num(row, "attributedconversions30d"),
    attributedUnitsOrdered30d: num(row, "attributedunitsordered30d"),
  };
}

async function fetchWindsorRaw(fields: string[], dateFrom: string, dateTo: string): Promise<RawRow[]> {
  const apiKey = process.env.WINDSOR_API_KEY;
  if (!apiKey) {
    throw new Error("WINDSOR_API_KEY não configurada");
  }
  const endpoint = process.env.WINDSOR_AMAZON_ADS_ENDPOINT ?? "https://connectors.windsor.ai/amazon_ads";

  const url = new URL(endpoint);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("date_from", dateFrom);
  url.searchParams.set("date_to", dateTo);
  url.searchParams.set("fields", fields.join(","));

  // Sem timeout aqui, se o Windsor travar (já aconteceu), a requisição fica
  // pendurada pra sempre e o usuário nunca vê um erro — só um loading eterno.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 110_000);

  let res: Response;
  try {
    res = await fetch(url.toString(), { cache: "no-store", signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Windsor não respondeu em 110s (serviço pode estar fora do ar) — tente novamente em instantes");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const json = (await res.json()) as { data?: RawRow[]; error?: string };

  if (json.error) {
    throw new Error(`Windsor: ${json.error}`);
  }
  if (!res.ok || !json.data) {
    throw new Error(`Windsor respondeu ${res.status} sem dados`);
  }

  return json.data;
}

// Windsor faz proxy para relatórios assíncronos da Amazon Ads — janelas maiores
// podem levar mais de um minuto para responder.
export async function fetchAmazonAdsCampaigns(dateFrom: string, dateTo: string): Promise<AmazonAdsCampaign[]> {
  const rows = await fetchWindsorRaw(AMAZON_FIELDS, dateFrom, dateTo);
  return rows.map(mapCampaign);
}

const AMAZON_DAILY_FIELDS = [
  "date",
  "sponsored_products_campaign__clicks",
  "sponsored_products_campaign__cost",
  "sponsored_products_campaign__impressions",
  "sponsored_products_campaign__attributedsales30d",
];

export interface AmazonDailyRow {
  date: string;
  clicks: number;
  cost: number;
  impressions: number;
  attributedSales30d: number;
}

// "date" como field agrupa a resposta por dia (convenção padrão dos
// conectores Windsor.ai) — ainda não testado ao vivo pois o Windsor está
// fora do ar no momento em que isso foi escrito; erra de forma isolada
// (não derruba os outros canais) se o formato vier diferente do esperado.
export async function fetchAmazonAdsDailySeries(dateFrom: string, dateTo: string): Promise<AmazonDailyRow[]> {
  const rows = await fetchWindsorRaw(AMAZON_DAILY_FIELDS, dateFrom, dateTo);
  return rows.map((row) => ({
    date: String(row.date ?? ""),
    clicks: num(row, "clicks"),
    cost: num(row, "cost"),
    impressions: num(row, "impressions"),
    attributedSales30d: num(row, "attributedsales30d"),
  }));
}

export function summarizeAmazonAdsCampaigns(campaigns: AmazonAdsCampaign[]): AmazonAdsSummary {
  const investimento = campaigns.reduce((sum, c) => sum + c.cost, 0);
  const cliques = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const impressoes = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const vendas30d = campaigns.reduce((sum, c) => sum + c.attributedSales30d, 0);
  const campanhasAtivas = campaigns.filter((c) => c.status === "ENABLED").length;

  return {
    investimento,
    cliques,
    impressoes,
    vendas30d,
    ctr: impressoes > 0 ? cliques / impressoes : 0,
    cpc: cliques > 0 ? investimento / cliques : 0,
    roas: investimento > 0 ? vendas30d / investimento : 0,
    acos: vendas30d > 0 ? investimento / vendas30d : 0,
    campanhasAtivas,
    totalCampanhas: campaigns.length,
  };
}
