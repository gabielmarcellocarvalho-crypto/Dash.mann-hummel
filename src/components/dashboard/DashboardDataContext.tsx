"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useDashboardData, type ChannelState } from "@/lib/use-dashboard-data";
import { useDailyTrend, type DailyTrendState } from "@/lib/use-daily-trend";
import { periodDateRange, rangeLabel } from "@/lib/platforms/period";
import type { ChannelId, DateRange, Period } from "@/lib/platforms/types";

const ALL_CHANNELS: ChannelId[] = ["meli", "google", "amazon", "meta"];

interface DashboardFiltersContextValue {
  period: Period;
  setPeriod: (period: Period) => void;
  customRange: DateRange | null;
  setCustomRange: (range: DateRange) => void;
  range: DateRange;
  periodLabel: string;
  channels: ChannelId[];
  toggleChannel: (channel: ChannelId) => void;
  refresh: () => void;
  isRefreshing: boolean;
  data: Record<ChannelId, ChannelState>;
  previousData: Record<ChannelId, ChannelState>;
  dailyTrend: DailyTrendState;
  lastUpdatedAt: number | null;
}

const DashboardFiltersContext = createContext<DashboardFiltersContextValue | null>(null);

export function DashboardFiltersProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<Period>("30d");
  const [customRange, setCustomRangeState] = useState<DateRange | null>(null);
  const [channels, setChannels] = useState<ChannelId[]>(ALL_CHANNELS);
  const [refreshNonce, setRefreshNonce] = useState(0);

  // Selecionar um preset (7/14/30/90 dias) sempre volta a ter prioridade sobre
  // um período personalizado aplicado anteriormente.
  const setPeriod = (next: Period) => {
    setPeriodState(next);
    setCustomRangeState(null);
  };

  const setCustomRange = (next: DateRange) => {
    setCustomRangeState(next);
  };

  const range = customRange ?? periodDateRange(period);
  const periodLabel = customRange
    ? rangeLabel(customRange)
    : { "7d": "7 dias", "14d": "14 dias", "30d": "30 dias", "90d": "90 dias" }[period];

  const toggleChannel = (channel: ChannelId) => {
    setChannels((prev) => {
      if (prev.includes(channel)) {
        if (prev.length === 1) return prev; // mantém ao menos 1 canal ativo
        return prev.filter((id) => id !== channel);
      }
      return [...prev, channel];
    });
  };

  const { state: data, previousState: previousData, lastUpdatedAt } = useDashboardData(range, refreshNonce);
  const dailyTrend = useDailyTrend(range, channels, refreshNonce);

  const isRefreshing = channels.some((c) => data[c].status === "loading");

  const value = useMemo<DashboardFiltersContextValue>(
    () => ({
      period,
      setPeriod,
      customRange,
      setCustomRange,
      range,
      periodLabel,
      channels,
      toggleChannel,
      refresh: () => setRefreshNonce((n) => n + 1),
      isRefreshing,
      data,
      previousData,
      dailyTrend,
      lastUpdatedAt,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      period,
      customRange,
      range.dateFrom,
      range.dateTo,
      channels,
      data,
      previousData,
      dailyTrend,
      isRefreshing,
      lastUpdatedAt,
    ],
  );

  return <DashboardFiltersContext.Provider value={value}>{children}</DashboardFiltersContext.Provider>;
}

export function useDashboardFilters(): DashboardFiltersContextValue {
  const ctx = useContext(DashboardFiltersContext);
  if (!ctx) throw new Error("useDashboardFilters deve ser usado dentro de <DashboardFiltersProvider>");
  return ctx;
}
