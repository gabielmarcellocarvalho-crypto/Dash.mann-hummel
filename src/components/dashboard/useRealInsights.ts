"use client";

import { CHANNELS } from "@/data/mock-dashboard";
import { generateInsights, type InsightItem } from "@/lib/insights-engine";
import type { ChannelId } from "@/lib/platforms/types";
import { useDashboardFilters } from "./DashboardDataContext";

const CHANNEL_NAMES = Object.fromEntries(CHANNELS.map((c) => [c.id, c.name])) as Record<ChannelId, string>;

export function useRealInsights(): InsightItem[] {
  const { channels, data, periodLabel } = useDashboardFilters();

  const summaries = channels
    .map((c) => data[c].summary)
    .filter((s): s is NonNullable<typeof s> => s !== null);
  const campaigns = channels.flatMap((c) => data[c].campaigns);

  return generateInsights(summaries, campaigns, CHANNEL_NAMES, periodLabel);
}
