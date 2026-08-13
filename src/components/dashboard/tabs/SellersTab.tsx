"use client";

import { useEffect, useState } from "react";
import { Section } from "../Section";
import { Trend } from "../Trend";
import { ProgressList } from "../ProgressList";
import { formatBRL, formatCompactBRL } from "@/lib/format";

interface MonthlyRow {
  label: string;
  month: number;
  total2025: number;
  total2026: number;
}

interface QuarterRow {
  label: string;
  total2025: number;
  total2026: number;
}

interface TopSeller {
  revendedor: string;
  classificacao: string;
  receita2026: number;
  participacao: number;
}

interface SellerMetricsResponse {
  monthly: MonthlyRow[];
  quarterly: QuarterRow[];
  semestral: { total2025: number; total2026: number; crescimentoPct: number };
  topSellers: TopSeller[];
  baseComparativo: {
    antigos: { count: number; receita2026: number };
    novos: { count: number; receita2026: number };
  };
  sellerCount: number;
}

interface SellersState {
  status: "loading" | "success" | "error";
  data: SellerMetricsResponse | null;
  error: string | null;
}

function pct(a: number, b: number): number {
  return b > 0 ? ((a - b) / b) * 100 : 0;
}

function DualBars({ rows }: { rows: { label: string; total2025: number; total2026: number }[] }) {
  const max = Math.max(...rows.flatMap((r) => [r.total2025, r.total2026]), 1);
  return (
    <div className="flex h-44 items-end justify-between gap-2 sm:gap-4">
      {rows.map((r) => (
        <div key={r.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <div className="flex h-36 w-full items-end justify-center gap-1">
            <div
              className="w-full max-w-6 rounded-t-[3px] bg-gradient-to-t from-success/60 to-success shadow-[0_0_10px_rgba(34,197,94,0.35)] transition-all duration-300"
              style={{ height: `${Math.max(2, (r.total2025 / max) * 100)}%` }}
              title={`2025: ${formatBRL(r.total2025)}`}
            />
            <div
              className="w-full max-w-6 rounded-t-[3px] bg-gradient-to-t from-accent/60 to-accent shadow-[0_0_10px_var(--color-accent-glow)] transition-all duration-300"
              style={{ height: `${Math.max(2, (r.total2026 / max) * 100)}%` }}
              title={`2026: ${formatBRL(r.total2026)}`}
            />
          </div>
          <span className="text-[10.5px] font-medium text-text-3">{r.label}</span>
        </div>
      ))}
    </div>
  );
}

export function SellersTab() {
  const [state, setState] = useState<SellersState>({ status: "loading", data: null, error: null });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/seller-metrics")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`);
        return json as SellerMetricsResponse;
      })
      .then((json) => {
        if (cancelled) return;
        setState({ status: "success", data: json, error: null });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({ status: "error", data: null, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-center text-[12.5px] text-text-3">
        Carregando dados de revendedores…
      </div>
    );
  }
  if (state.status === "error" || !state.data) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-center text-[12.5px] text-text-3">
        Não foi possível carregar: {state.error}
      </div>
    );
  }

  const { monthly, quarterly, semestral, topSellers, baseComparativo, sellerCount } = state.data;
  const antigosPct = semestral.total2026 > 0 ? (baseComparativo.antigos.receita2026 / semestral.total2026) * 100 : 0;
  const novosPct = semestral.total2026 > 0 ? (baseComparativo.novos.receita2026 / semestral.total2026) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-dashed border-border-strong bg-surface px-4 py-3.5">
        <p className="text-[12.5px] leading-relaxed text-text-2">
          Faturamento de revendedores (sellers) do Mercado Livre — {sellerCount} contas ativas. Alimentado
          manualmente mês a mês a partir da planilha de revendedor, não tem API própria.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
        <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-3">Semestre 2025 (Jan-Jun)</p>
            <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-text-3">
              {formatBRL(semestral.total2025)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-3">Semestre 2026 (Jan-Jun)</p>
            <p className="mt-0.5 font-mono text-xl font-bold tabular-nums text-text-1">
              {formatBRL(semestral.total2026)}
            </p>
          </div>
          <Trend direction={semestral.crescimentoPct >= 0 ? "up" : "down"} className="text-base">
            {semestral.crescimentoPct >= 0 ? "+" : "−"}
            {Math.abs(semestral.crescimentoPct).toFixed(1).replace(".", ",")}% no semestre
          </Trend>
        </div>
      </div>

      <Section title="Crescimento Mensal" subtitle="Jan a Jul · 2025 à esquerda, 2026 à direita">
        <DualBars rows={monthly} />
      </Section>

      <Section title="Crescimento Trimestral" subtitle="Q1 (Jan-Mar) e Q2 (Abr-Jun) · 2025 à esquerda, 2026 à direita">
        <div className="grid grid-cols-2 gap-4 sm:gap-8">
          {quarterly.map((q) => {
            const delta = pct(q.total2026, q.total2025);
            return (
              <div key={q.label} className="rounded-lg border border-border/60 bg-background p-3.5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-3">{q.label}</p>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-text-3">2025</p>
                    <p className="font-mono text-[13px] font-semibold tabular-nums text-text-3">
                      {formatCompactBRL(q.total2025)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-3">2026</p>
                    <p className="font-mono text-[15px] font-bold tabular-nums text-text-1">
                      {formatCompactBRL(q.total2026)}
                    </p>
                  </div>
                  <Trend direction={delta >= 0 ? "up" : "down"}>
                    {delta >= 0 ? "+" : "−"}
                    {Math.abs(delta).toFixed(0)}%
                  </Trend>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Top Sellers" subtitle="Semestre 2026 · do mais vendido pro menos">
        <ProgressList
          rows={topSellers.map((s, i) => ({
            key: `${s.revendedor}-${i}`,
            label: s.revendedor,
            display: formatCompactBRL(s.receita2026),
            secondary: `${s.participacao.toFixed(1).replace(".", ",")}%`,
            percent: (s.receita2026 / (topSellers[0]?.receita2026 || 1)) * 100,
            colorClass: s.classificacao === "Novo" ? "bg-emerald-400" : "bg-sky-400",
          }))}
        />
        <p className="mt-3 text-[11px] leading-snug text-text-3">
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-400 align-middle" /> base antiga
          <span className="mr-1 ml-3 inline-block h-2 w-2 rounded-full bg-emerald-400 align-middle" /> base nova
        </p>
      </Section>

      <Section title="Base Antiga vs. Base Nova" subtitle="Participação na receita do semestre 2026">
        <ProgressList
          rows={[
            {
              key: "antigos",
              label: `Base antiga (${baseComparativo.antigos.count} sellers)`,
              display: formatCompactBRL(baseComparativo.antigos.receita2026),
              secondary: `${antigosPct.toFixed(1).replace(".", ",")}%`,
              percent: antigosPct,
              colorClass: "bg-sky-400",
            },
            {
              key: "novos",
              label: `Base nova (${baseComparativo.novos.count} sellers)`,
              display: formatCompactBRL(baseComparativo.novos.receita2026),
              secondary: `${novosPct.toFixed(1).replace(".", ",")}%`,
              percent: novosPct,
              colorClass: "bg-emerald-400",
            },
          ]}
        />
      </Section>
    </div>
  );
}
