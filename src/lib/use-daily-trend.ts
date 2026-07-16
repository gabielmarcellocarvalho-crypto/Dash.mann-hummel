"use client";

import { useEffect, useState } from "react";
import { previousEquivalentRange } from "./platforms/period";
import { REVENUE_TRACKED, type ChannelId, type DailyPoint, type DateRange } from "./platforms/types";

export interface RevenueTrendPoint {
  date: string; // dd/mm, pro eixo do gráfico
  atual: number;
  anterior: number;
}

interface ChannelDailyState {
  status: "loading" | "success" | "error";
  current: DailyPoint[];
  previous: DailyPoint[];
}

export interface DailyTrendState {
  loading: boolean; // true só enquanto NENHUM canal ainda resolveu
  points: RevenueTrendPoint[];
  channelsWithData: ChannelId[];
  channelsPending: ChannelId[];
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

function buildPoints(
  range: DateRange,
  previousRange: DateRange,
  channelStates: Record<string, ChannelDailyState>,
): RevenueTrendPoint[] {
  const ready = Object.values(channelStates).filter((s) => s.status === "success");
  const currentByDate = revenueByDate(ready.map((s) => s.current));
  const previousByDate = revenueByDate(ready.map((s) => s.previous));

  const currentDates = enumerateDates(range);
  const previousDates = enumerateDates(previousRange);

  return currentDates.map((date, i) => {
    const [, m, d] = date.split("-");
    return {
      date: `${d}/${m}`,
      atual: currentByDate.get(date) ?? 0,
      anterior: previousByDate.get(previousDates[i]) ?? 0,
    };
  });
}

// Só soma canais com revenueTracked === true (MELI/Amazon) — igual à regra
// usada no resto do dashboard, pra não misturar receita real com o "R$0"
// de canais sem conversão de valor configurada (Google/Meta).
//
// Cada canal resolve de forma INDEPENDENTE (current+previous juntos, mas sem
// bloquear os outros canais) — se a Amazon estiver lenta/fora do ar, o
// gráfico já aparece com o MELI assim que ele responder, em vez de ficar
// "carregando" por até ~2min esperando todo mundo responder junto.
export function useDailyTrend(range: DateRange, channels: ChannelId[], refreshNonce: number): DailyTrendState {
  const channelsKey = channels.join(",");
  const requestKey = `${range.dateFrom}|${range.dateTo}|${channelsKey}|${refreshNonce}`;

  const relevantChannels = (channelsKey.split(",").filter(Boolean) as ChannelId[]).filter((c) => REVENUE_TRACKED[c]);

  const [channelStates, setChannelStates] = useState<Record<string, ChannelDailyState>>({});
  const [appliedKey, setAppliedKey] = useState(requestKey);

  // Padrão "ajustar estado durante a renderização": reseta assim que
  // período/canais mudam, sem chamar setState direto no corpo do efeito.
  if (appliedKey !== requestKey) {
    setAppliedKey(requestKey);
    const reset: Record<string, ChannelDailyState> = {};
    for (const c of relevantChannels) reset[c] = { status: "loading", current: [], previous: [] };
    setChannelStates(reset);
  }

  useEffect(() => {
    let cancelled = false;
    const activeChannels = (channelsKey.split(",").filter(Boolean) as ChannelId[]).filter((c) => REVENUE_TRACKED[c]);
    const previousRange = previousEquivalentRange(range);

    activeChannels.forEach((channelId) => {
      Promise.all([fetchChannelSeries(channelId, range), fetchChannelSeries(channelId, previousRange)]).then(
        ([current, previous]) => {
          if (cancelled) return;
          setChannelStates((prev) => ({
            ...prev,
            [channelId]:
              current !== null && previous !== null
                ? { status: "success", current, previous }
                : { status: "error", current: [], previous: [] },
          }));
        },
      );
    });

    return () => {
      cancelled = true;
    };
    // range é recriado a cada render (novo objeto); usamos dateFrom/dateTo
    // (primitivos) como deps pra não re-disparar o efeito por identidade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.dateFrom, range.dateTo, channelsKey, refreshNonce]);

  const channelsWithData = relevantChannels.filter((c) => channelStates[c]?.status === "success");
  const channelsPending = relevantChannels.filter((c) => !channelStates[c] || channelStates[c].status === "loading");
  const channelsFailed = relevantChannels.filter((c) => channelStates[c]?.status === "error");

  const previousRange = previousEquivalentRange(range);
  const points = buildPoints(range, previousRange, channelStates);

  return {
    loading: relevantChannels.length > 0 && channelsWithData.length === 0 && channelsPending.length > 0,
    points,
    channelsWithData,
    channelsPending,
    channelsFailed,
  };
}
