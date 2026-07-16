"use client";

import { useEffect, useState } from "react";
import { previousEquivalentRange } from "./platforms/period";
import { REVENUE_TRACKED, type ChannelId, type DailyPoint, type DateRange } from "./platforms/types";

export interface RevenueTrendPoint {
  date: string; // dd/mm, pro eixo do gráfico
  atual: number;
  anterior: number;
}

interface DailyTrendState {
  loading: boolean;
  points: RevenueTrendPoint[];
  channelsWithData: ChannelId[];
  channelsFailed: ChannelId[];
}

const ENDPOINTS: Record<ChannelId, string> = {
  meli: "/api/meli-ads/daily",
  google: "/api/google-ads/daily",
  amazon: "/api/amazon-ads/daily",
  meta: "/api/meta-ads/daily",
};

async function fetchChannelSeries(channelId: ChannelId, range: DateRange): Promise<DailyPoint[] | null> {
  try {
    const res = await fetch(`${ENDPOINTS[channelId]}?date_from=${range.dateFrom}&date_to=${range.dateTo}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.series as DailyPoint[];
  } catch {
    return null;
  }
}

function enumerateDates(range: DateRange): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${range.dateFrom}T00:00:00Z`);
  const end = new Date(`${range.dateTo}T00:00:00Z`);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function revenueByDate(seriesList: DailyPoint[][]): Map<string, number> {
  const map = new Map<string, number>();
  for (const series of seriesList) {
    for (const point of series) {
      map.set(point.date, (map.get(point.date) ?? 0) + point.revenue);
    }
  }
  return map;
}

// Só soma canais com revenueTracked === true (MELI/Amazon) — igual à regra
// usada no resto do dashboard, pra não misturar receita real com o "R$0"
// de canais sem conversão de valor configurada (Google/Meta).
export function useDailyTrend(range: DateRange, channels: ChannelId[]): DailyTrendState {
  const channelsKey = channels.join(",");
  const requestKey = `${range.dateFrom}|${range.dateTo}|${channelsKey}`;

  const [state, setState] = useState<DailyTrendState>({
    loading: true,
    points: [],
    channelsWithData: [],
    channelsFailed: [],
  });
  const [appliedKey, setAppliedKey] = useState(requestKey);

  // Padrão "ajustar estado durante a renderização": volta pro loading assim
  // que período/canais mudam, sem chamar setState direto no corpo do efeito.
  if (appliedKey !== requestKey) {
    setAppliedKey(requestKey);
    setState((prev) => ({ ...prev, loading: true }));
  }

  useEffect(() => {
    let cancelled = false;

    const activeChannels = (channelsKey.split(",").filter(Boolean) as ChannelId[]).filter(
      (c) => REVENUE_TRACKED[c],
    );
    const previousRange = previousEquivalentRange(range);

    Promise.all([
      Promise.all(activeChannels.map((c) => fetchChannelSeries(c, range))),
      Promise.all(activeChannels.map((c) => fetchChannelSeries(c, previousRange))),
    ]).then(([currentResults, previousResults]) => {
      if (cancelled) return;

      const channelsWithData = activeChannels.filter((_, i) => currentResults[i] !== null);
      const channelsFailed = activeChannels.filter((_, i) => currentResults[i] === null);

      const currentSeries = currentResults.filter((r): r is DailyPoint[] => r !== null);
      const previousSeries = previousResults.filter((r): r is DailyPoint[] => r !== null);

      const currentByDate = revenueByDate(currentSeries);
      const previousByDate = revenueByDate(previousSeries);

      const currentDates = enumerateDates(range);
      const previousDates = enumerateDates(previousRange);

      const points: RevenueTrendPoint[] = currentDates.map((date, i) => {
        const [, m, d] = date.split("-");
        return {
          date: `${d}/${m}`,
          atual: currentByDate.get(date) ?? 0,
          anterior: previousByDate.get(previousDates[i]) ?? 0,
        };
      });

      setState({ loading: false, points, channelsWithData, channelsFailed });
    });

    return () => {
      cancelled = true;
    };
    // range é recriado a cada render (novo objeto); usamos dateFrom/dateTo
    // (primitivos) como deps pra não re-disparar o efeito por identidade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.dateFrom, range.dateTo, channelsKey]);

  return state;
}
