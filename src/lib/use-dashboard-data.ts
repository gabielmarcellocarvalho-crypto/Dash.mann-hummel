"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { previousEquivalentRange } from "./platforms/period";
import type { CampaignRow, ChannelId, ChannelSummary, DateRange } from "./platforms/types";

export interface ChannelState {
  status: "loading" | "success" | "error";
  summary: ChannelSummary | null;
  campaigns: CampaignRow[];
  error: string | null;
}

export interface DashboardDataResult {
  state: Record<ChannelId, ChannelState>;
  // Mesmo formato, mas para o período imediatamente anterior de mesma duração —
  // usado só para calcular variação real (%), nunca exibido campanha a campanha.
  previousState: Record<ChannelId, ChannelState>;
  lastUpdatedAt: number | null;
}

const ENDPOINTS: Record<ChannelId, string> = {
  meli: "/api/meli-ads",
  google: "/api/google-ads",
  amazon: "/api/amazon-ads",
  meta: "/api/meta-ads",
};

const ALL_CHANNELS: ChannelId[] = ["meli", "google", "amazon", "meta"];

function loadingState(): ChannelState {
  return { status: "loading", summary: null, campaigns: [], error: null };
}

function buildInitialState(): Record<ChannelId, ChannelState> {
  const result = {} as Record<ChannelId, ChannelState>;
  for (const id of ALL_CHANNELS) {
    result[id] = loadingState();
  }
  return result;
}

function fetchChannel(
  channelId: ChannelId,
  range: DateRange,
  cancelledRef: { cancelled: boolean },
  setState: Dispatch<SetStateAction<Record<ChannelId, ChannelState>>>,
  onSettled: () => void,
) {
  fetch(`${ENDPOINTS[channelId]}?date_from=${range.dateFrom}&date_to=${range.dateTo}`)
    .then(async (res) => {
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`);
      return json as { campaigns: CampaignRow[]; summary: ChannelSummary };
    })
    .then((json) => {
      if (cancelledRef.cancelled) return;
      setState((prev) => ({
        ...prev,
        [channelId]: { status: "success", summary: json.summary, campaigns: json.campaigns, error: null },
      }));
      onSettled();
    })
    .catch((err: Error) => {
      if (cancelledRef.cancelled) return;
      setState((prev) => ({
        ...prev,
        [channelId]: { status: "error", summary: null, campaigns: [], error: err.message },
      }));
      onSettled();
    });
}

// Busca SEMPRE os 4 canais, independente de quais estão selecionados no filtro —
// selecionar/desselecionar um canal na UI é só um filtro de exibição sobre dados já
// em cache, nunca dispara uma nova requisição (evita o "pisca-pisca" de números
// parciais enquanto canais reconsultam a API do zero a cada toggle).
//
// Também busca o período anterior equivalente em paralelo, pra dar variação
// real (%) nos KPIs em vez de números sem contexto nenhum.
export function useDashboardData(range: DateRange, refreshNonce: number): DashboardDataResult {
  const requestKey = `${range.dateFrom}|${range.dateTo}|${refreshNonce}`;

  const [state, setState] = useState<Record<ChannelId, ChannelState>>(buildInitialState);
  const [previousState, setPreviousState] = useState<Record<ChannelId, ChannelState>>(buildInitialState);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [appliedKey, setAppliedKey] = useState(requestKey);

  // Padrão "ajustar estado durante a renderização": reseta para loading assim que
  // o período (preset ou personalizado) muda, sem passar por um efeito.
  if (appliedKey !== requestKey) {
    setAppliedKey(requestKey);
    setState(buildInitialState());
    setPreviousState(buildInitialState());
  }

  useEffect(() => {
    const cancelledRef = { cancelled: false };
    const previousRange = previousEquivalentRange(range);

    ALL_CHANNELS.forEach((channelId) => {
      fetchChannel(channelId, range, cancelledRef, setState, () => setLastUpdatedAt(Date.now()));
      fetchChannel(channelId, previousRange, cancelledRef, setPreviousState, () => {});
    });

    return () => {
      cancelledRef.cancelled = true;
    };
    // range é recriado a cada render (novo objeto); usamos dateFrom/dateTo
    // (primitivos) como deps pra não re-disparar o efeito por identidade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.dateFrom, range.dateTo, refreshNonce]);

  return { state, previousState, lastUpdatedAt };
}
