"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { CHANNELS } from "@/data/mock-dashboard";
import type { ChannelId } from "@/lib/platforms/types";
import { formatBRL } from "@/lib/format";
import { Trend } from "../Trend";
import { Section } from "../Section";

// Ano a Ano só existe pra Mercado Livre e Amazon — Google/Meta não geram
// venda direta de marketplace, então não entram no comparativo (pedido da
// Maria em 12/08: "esse ano a ano é só Mercado Livre e Amazon").
const YOY_CHANNELS: ChannelId[] = ["meli", "amazon"];
const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type ViewKey = "geral" | "ads";

interface MonthlyRow {
  month: number;
  meta: number | null;
  realizado: number | null;
  receitaAnoAnterior: number | null;
  adsMeta: number | null;
  adsRealizado: number | null;
}

interface FetchState {
  status: "loading" | "success" | "error";
  rows: MonthlyRow[];
  error: string | null;
}

function pct(a: number, b: number): number {
  return b > 0 ? ((a - b) / b) * 100 : 0;
}

// Barrinhas mensais 2025 (esquerda) / 2026 (direita) — ordem fixa pedida pela
// Maria: "sempre 2025 a barrinha da esquerda e 2026 a barrinha da direita".
function YearBars({ rows }: { rows: { label: string; y2025: number; y2026: number }[] }) {
  const max = Math.max(...rows.flatMap((r) => [r.y2025, r.y2026]), 1);
  return (
    <div className="flex h-44 items-end justify-between gap-2 overflow-x-auto sm:gap-3">
      {rows.map((r) => (
        <div key={r.label} className="flex h-full flex-1 min-w-[34px] flex-col items-center justify-end gap-1.5">
          <div className="flex h-36 w-full items-end justify-center gap-[3px]">
            <div
              className="w-full max-w-3 rounded-t-[3px] bg-gradient-to-t from-success/60 to-success shadow-[0_0_10px_rgba(34,197,94,0.35)] transition-all duration-300"
              style={{ height: `${Math.max(2, (r.y2025 / max) * 100)}%` }}
              title={`2025: ${formatBRL(r.y2025)}`}
            />
            <div
              className="w-full max-w-3 rounded-t-[3px] bg-gradient-to-t from-accent/60 to-accent shadow-[0_0_10px_var(--color-accent-glow)] transition-all duration-300"
              style={{ height: `${Math.max(2, (r.y2026 / max) * 100)}%` }}
              title={`2026: ${formatBRL(r.y2026)}`}
            />
          </div>
          <span className="text-[10px] font-medium text-text-3">{r.label}</span>
        </div>
      ))}
    </div>
  );
}

export function YearOverYearTab() {
  const [selected, setSelected] = useState<ChannelId>(YOY_CHANNELS[0]);
  const [view, setView] = useState<ViewKey>("geral");
  const [state, setState] = useState<FetchState>({ status: "loading", rows: [], error: null });
  const [appliedChannel, setAppliedChannel] = useState<ChannelId>(selected);

  // Padrão "ajustar estado durante a renderização" (ver DashboardDataContext):
  // reseta assim que o canal muda, sem passar por um efeito.
  if (appliedChannel !== selected) {
    setAppliedChannel(selected);
    setState({ status: "loading", rows: [], error: null });
  }

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/monthly-metrics?channel=${selected}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`);
        return json as { months: MonthlyRow[] };
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

  const channel = CHANNELS.find((c) => c.id === selected)!;
  const rows = state.rows;

  const geralRows = rows.map((r) => ({
    label: MONTH_NAMES[r.month - 1],
    y2025: r.receitaAnoAnterior ?? 0,
    y2026: r.realizado ?? 0,
    hasData: r.realizado != null,
  }));
  const adsRows = rows.map((r) => ({
    label: MONTH_NAMES[r.month - 1],
    meta: r.adsMeta ?? 0,
    realizado: r.adsRealizado,
  }));

  const geralWithData = geralRows.filter((r) => r.hasData);
  const total2025 = geralWithData.reduce((sum, r) => sum + r.y2025, 0);
  const total2026 = geralWithData.reduce((sum, r) => sum + r.y2026, 0);
  const totalDelta = pct(total2026, total2025);

  const adsWithData = adsRows.filter((r) => r.realizado != null);
  const adsMetaTotal = adsWithData.reduce((sum, r) => sum + r.meta, 0);
  const adsRealizadoTotal = adsWithData.reduce((sum, r) => sum + (r.realizado ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border-strong bg-surface px-4 py-3.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-text-3" strokeWidth={2} aria-hidden="true" />
        <p className="text-[12.5px] leading-relaxed text-text-2">
          Comparativo mensal de receita — 2026 vs. mesmo mês de 2025. Só Mercado Livre e Amazon entram aqui (únicos
          com venda direta de marketplace); Google e Meta ficam de fora.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {YOY_CHANNELS.map((id) => {
            const c = CHANNELS.find((ch) => ch.id === id)!;
            const isActive = id === selected;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelected(id)}
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

        <div className="flex gap-1.5 rounded-lg border border-border bg-surface p-1">
          {(["geral", "ads"] as ViewKey[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors duration-150 ${
                view === v ? "bg-accent text-accent-foreground" : "text-text-3 hover:text-text-1"
              }`}
            >
              {v === "geral" ? "Geral" : "Ads"}
            </button>
          ))}
        </div>
      </div>

      {state.status === "loading" ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-[12.5px] text-text-3">
          Carregando comparativo de {channel.name}…
        </div>
      ) : state.status === "error" ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-[12.5px] text-text-3">
          Não foi possível carregar o comparativo: {state.error}
        </div>
      ) : view === "geral" ? (
        geralWithData.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-center text-[12.5px] text-text-3">
            {channel.name} ainda não tem receita geral importada da planilha.
          </div>
        ) : (
          <>
            <Section
              title={`${channel.name} · Receita Geral — 2026 vs 2025`}
              subtitle="2025 à esquerda, 2026 à direita, sempre nessa ordem"
            >
              <YearBars rows={geralRows} />
            </Section>

            <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-text-3">Acumulado 2025</p>
                  <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-text-3">{formatBRL(total2025)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-text-3">Acumulado 2026</p>
                  <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-text-1">{formatBRL(total2026)}</p>
                </div>
                <Trend direction={totalDelta >= 0 ? "up" : "down"} className="text-base">
                  {totalDelta >= 0 ? "+" : "−"}
                  {Math.abs(totalDelta).toFixed(1).replace(".", ",")}%
                </Trend>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      {["Mês", "2025", "2026", "Variação"].map((h, i) => (
                        <th
                          key={h}
                          className={`whitespace-nowrap pb-2.5 text-[10.5px] font-bold uppercase tracking-wider text-text-3 ${
                            i === 0 ? "text-left" : "text-right"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {geralRows.map((r) => {
                      const delta = r.hasData ? pct(r.y2026, r.y2025) : null;
                      return (
                        <tr key={r.label} className="border-b border-dashed border-border last:border-0">
                          <td className="py-2.5 text-[13px] text-text-2">{r.label}</td>
                          <td className="py-2.5 text-right font-mono text-[12.5px] tabular-nums text-text-3">
                            {r.hasData ? formatBRL(r.y2025) : "—"}
                          </td>
                          <td className="py-2.5 text-right font-mono text-[13px] font-bold tabular-nums text-text-1">
                            {r.hasData ? formatBRL(r.y2026) : "—"}
                          </td>
                          <td className="py-2.5 pl-4 text-right">
                            {delta !== null ? (
                              <Trend direction={delta >= 0 ? "up" : "down"}>
                                {delta >= 0 ? "+" : "−"}
                                {Math.abs(delta).toFixed(0)}%
                              </Trend>
                            ) : (
                              <span className="text-[12.5px] text-text-3">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      ) : adsWithData.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-[12.5px] text-text-3">
          {channel.name} ainda não tem meta/realizado de Ads importado da planilha.
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border-strong bg-surface px-4 py-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-text-3" strokeWidth={2} aria-hidden="true" />
            <p className="text-[12.5px] leading-relaxed text-text-2">
              Sem comparativo com 2025 aqui: a meta de receita de Ads (separada da geral) só passou a ser rastreada em
              2026. Mostrando meta vs. realizado do ano corrente.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-text-3">Meta Ads Acumulada</p>
                <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-text-3">
                  {formatBRL(adsMetaTotal)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-text-3">Realizado Ads Acumulado</p>
                <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-text-1">
                  {formatBRL(adsRealizadoTotal)}
                </p>
              </div>
              <Trend direction={adsRealizadoTotal >= adsMetaTotal ? "up" : "down"} className="text-base">
                {adsMetaTotal > 0 ? `${((adsRealizadoTotal / adsMetaTotal) * 100).toFixed(0)}% da meta` : "—"}
              </Trend>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {["Mês", "Meta Ads", "Realizado Ads", "% da Meta"].map((h, i) => (
                      <th
                        key={h}
                        className={`whitespace-nowrap pb-2.5 text-[10.5px] font-bold uppercase tracking-wider text-text-3 ${
                          i === 0 ? "text-left" : "text-right"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {adsRows.map((r) => {
                    const rowPct = r.realizado != null && r.meta > 0 ? (r.realizado / r.meta) * 100 : null;
                    return (
                      <tr key={r.label} className="border-b border-dashed border-border last:border-0">
                        <td className="py-2.5 text-[13px] text-text-2">{r.label}</td>
                        <td className="py-2.5 text-right font-mono text-[12.5px] tabular-nums text-text-3">
                          {formatBRL(r.meta)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-[13px] font-bold tabular-nums text-text-1">
                          {r.realizado != null ? formatBRL(r.realizado) : "—"}
                        </td>
                        <td className="py-2.5 pl-4 text-right">
                          {rowPct !== null ? (
                            <Trend direction={rowPct >= 100 ? "up" : "down"}>{rowPct.toFixed(0)}%</Trend>
                          ) : (
                            <span className="text-[12.5px] text-text-3">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
