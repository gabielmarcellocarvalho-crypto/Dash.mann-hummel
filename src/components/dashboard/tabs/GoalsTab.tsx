"use client";

import { useEffect, useState } from "react";
import { CHANNELS } from "@/data/mock-dashboard";
import type { GoalMonth } from "@/data/mock-dashboard";
import type { ChannelId } from "@/lib/platforms/types";
import { formatBRL } from "@/lib/format";
import { Badge } from "../Badge";
import { Section } from "../Section";
import { GoalsBarChart } from "../GoalsBarChart";
import { GoalsTable } from "../GoalsTable";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Só Amazon e Mercado Livre têm meta de receita de Ads separada da meta geral
// importada da planilha (Google/Meta só têm investimento — sem meta de venda).
const CHANNELS_WITH_ADS_GOAL: ChannelId[] = ["amazon", "meli"];

type GoalsViewKey = "geral" | "ads";

interface MonthlyMetricRow {
  month: number;
  meta: number | null;
  realizado: number | null;
  sazonalidade: number | null;
  adsMeta: number | null;
  adsRealizado: number | null;
}

interface GoalsState {
  status: "loading" | "success" | "error";
  rows: MonthlyMetricRow[];
  error: string | null;
}

function toGoalMonths(rows: MonthlyMetricRow[], view: GoalsViewKey): GoalMonth[] {
  return rows.map((r) => ({
    month: MONTH_NAMES[r.month - 1],
    sazonalidade: r.sazonalidade != null ? `${r.sazonalidade.toFixed(1).replace(".", ",")}%` : "—",
    meta: (view === "ads" ? r.adsMeta : r.meta) ?? 0,
    realizado: view === "ads" ? r.adsRealizado : r.realizado,
  }));
}

// Título fica diferente do nome do canal usado no resto do dashboard: aqui a
// visão "Geral" da Amazon mostra receita total (não só Ads) — manter "Amazon
// Ads" no título confundia (pedido da Maria em 12/08: "tirar o Ads do título").
function channelDisplayName(channelId: ChannelId, view: GoalsViewKey): string {
  if (channelId === "amazon") return view === "ads" ? "Amazon Ads" : "Amazon";
  if (channelId === "meli") return view === "ads" ? "Mercado Livre Ads" : "Mercado Livre";
  return CHANNELS.find((c) => c.id === channelId)!.name;
}

export function GoalsTab() {
  const [selected, setSelected] = useState<ChannelId>(CHANNELS[0].id);
  const [view, setView] = useState<GoalsViewKey>("geral");
  const [state, setState] = useState<GoalsState>({ status: "loading", rows: [], error: null });
  const [appliedChannel, setAppliedChannel] = useState<ChannelId>(selected);

  // Padrão "ajustar estado durante a renderização": reseta pra loading assim
  // que o canal muda, sem passar por um efeito (ver DashboardDataContext).
  if (appliedChannel !== selected) {
    setAppliedChannel(selected);
    setState({ status: "loading", rows: [], error: null });
    setView("geral");
  }

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/monthly-metrics?channel=${selected}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`);
        return json as { months: MonthlyMetricRow[] };
      })
      .then((json) => {
        if (cancelled) return;
        setState({ status: "success", rows: json.months, error: null });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({ status: "error", rows: [], error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  const showAdsToggle = CHANNELS_WITH_ADS_GOAL.includes(selected);
  const activeView = showAdsToggle ? view : "geral";
  const channelLabel = channelDisplayName(selected, activeView);
  const months = toGoalMonths(state.rows, activeView);

  const metaAnual = months.reduce((sum, m) => sum + m.meta, 0);
  const realizadoAcumulado = months.reduce((sum, m) => sum + (m.realizado ?? 0), 0);
  const percentNum = metaAnual > 0 ? (realizadoAcumulado / metaAnual) * 100 : 0;
  const gapRestante = metaAnual - realizadoAcumulado;
  const onTrack = percentNum >= 20;

  const lastMonthWithData = [...months].reverse().find((m) => m.realizado != null)?.month;
  const realizadoLabel = lastMonthWithData ? `Realizado Jan–${lastMonthWithData}` : "Realizado";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {CHANNELS.map((c) => {
          const isActive = c.id === selected;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={`cursor-pointer rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                isActive
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface text-text-2 hover:border-border-strong hover:text-text-1"
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {showAdsToggle && (
        <div className="flex gap-1.5 rounded-lg border border-border bg-surface p-1">
          {(["geral", "ads"] as GoalsViewKey[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors duration-150 ${
                activeView === v ? "bg-accent text-accent-foreground" : "text-text-3 hover:text-text-1"
              }`}
            >
              {v === "geral" ? "Geral" : "Ads"}
            </button>
          ))}
        </div>
      )}

      {state.status === "loading" ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-[12.5px] text-text-3">
          Carregando metas de {channelLabel}…
        </div>
      ) : state.status === "error" ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-[12.5px] text-text-3">
          Não foi possível carregar as metas: {state.error}
        </div>
      ) : months.every((m) => m.meta === 0) ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-[12.5px] text-text-3">
          {channelLabel} ainda não tem meta/realizado importado da planilha.
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-3">
                Pace — {channelLabel} · 2026
              </p>
              <Badge tone={onTrack ? "success" : "warning"}>
                {onTrack ? "Dentro do Ritmo" : "Atenção — Abaixo do Ritmo"}
              </Badge>
            </div>

            <div className="mb-4 flex flex-wrap items-end gap-x-8 gap-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-text-3">Meta Anual</p>
                <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-text-1">{formatBRL(metaAnual)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-text-3">{realizadoLabel}</p>
                <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-text-1">
                  {formatBRL(realizadoAcumulado)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-text-3">% da Meta</p>
                <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-accent">
                  {percentNum.toFixed(1).replace(".", ",")}%
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-text-3">Gap Restante</p>
                <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-text-1">
                  {formatBRL(Math.max(0, gapRestante))}
                </p>
              </div>
            </div>

            <div className="mb-1.5 flex items-center justify-between text-[10.5px] text-text-3">
              <span>R$ 0</span>
              <span>Meta: {formatBRL(metaAnual)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${Math.min(100, percentNum)}%` }}
              />
            </div>
          </div>

          <Section title="Meta vs Realizado por Mês">
            <GoalsBarChart months={months} />
          </Section>

          <Section title="Detalhamento Mensal">
            <GoalsTable months={months} />
          </Section>
        </>
      )}
    </div>
  );
}
