import {
  fetchAmazonAdsCampaigns as fetchWindsorCampaigns,
  fetchAmazonAdsDailySeries as fetchWindsorDailySeries,
} from "@/lib/windsor";
import { clampRangeForWindsor } from "./period";
import { summarizeCampaigns, type CampaignRow, type ChannelSummary, type DailyPoint, type DateRange } from "./types";

export async function fetchAmazonCampaigns(range: DateRange): Promise<CampaignRow[]> {
  const clamped = clampRangeForWindsor(range);
  const campaigns = await fetchWindsorCampaigns(clamped.dateFrom, clamped.dateTo);

  return campaigns.map((c) => ({
    channelId: "amazon",
    campaignId: c.campaignId,
    campaign: c.campaign,
    status: c.status,
    budget: c.budget,
    clicks: c.clicks,
    impressions: c.impressions,
    cost: c.cost,
    cpc: c.cpc,
    ctr: c.ctr,
    revenue: c.attributedSales30d,
    roas: c.roas,
    acos: c.acos,
    revenueTracked: true, // receita vem de vendas atribuídas reais reportadas pela Amazon
    units: c.attributedUnitsOrdered30d,
  }));
}

export function summarizeAmazon(campaigns: CampaignRow[]): ChannelSummary {
  return summarizeCampaigns("amazon", campaigns);
}

export async function fetchAmazonDailySeries(range: DateRange): Promise<DailyPoint[]> {
  const clamped = clampRangeForWindsor(range);
  const rows = await fetchWindsorDailySeries(clamped.dateFrom, clamped.dateTo);

  return rows.map((r) => ({
    date: r.date,
    cost: r.cost,
    clicks: r.clicks,
    impressions: r.impressions,
    revenue: r.attributedSales30d,
  }));
}
