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

interface MonthlyMetricRow {
  month: number;
  meta: number | null;
  realizado: number | null;
  sazonalidade: number | null;
}

interface GoalsState {
  status: "loading" | "success" | "error";
  months: GoalMonth[];
  error: string | null;
}

function toGoalMonths(rows: MonthlyMetricRow[]): GoalMonth[] {
  return rows.map((r) => ({
    month: MONTH_NAMES[r.month - 1],
    sazonalidade: r.sazonalidade != null ? `${r.sazonalidade.toFixed(1).replace(".", ",")}%` : "—",
    meta: r.meta ?? 0,
    realizado: r.realizado,
  }));
}

export function GoalsTab() {
  const [selected, setSelected] = useState<ChannelId>(CHANNELS[0].id);
  const [state, setState] = useState<GoalsState>({ status: "loading", months: [], error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", months: [], error: null });

    fetch(`/api/monthly-metrics?channel=${selected}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`);
        return json as { months: MonthlyMetricRow[] };
      })
      .then((json) => {
        if (cancelled) return;
        setState({ status: "success", months: toGoalMonths(json.months), error: null });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({ status: "error", months: [], error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  const channel = CHANNELS.find((c) => c.id === selected)!;
  const months = state.months;

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

      {state.status === "loading" ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-[12.5px] text-text-3">
          Carregando metas de {channel.name}…
        </div>
      ) : state.status === "error" ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-[12.5px] text-text-3">
          Não foi possível carregar as metas: {state.error}
        </div>
      ) : months.every((m) => m.meta === 0) ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-[12.5px] text-text-3">
          {channel.name} ainda não tem meta/realizado importado da planilha.
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-3">
                Pace — {channel.name} · 2026
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
