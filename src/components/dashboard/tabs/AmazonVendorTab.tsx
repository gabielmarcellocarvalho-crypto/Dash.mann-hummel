"use client";

import { useEffect, useState } from "react";
import { PackageSearch } from "lucide-react";
import { Section } from "../Section";
import { Trend } from "../Trend";

interface GlanceViewRow {
  label: string;
  month: number;
  views2025: number | null;
  views2026: number | null;
}

interface TopProduct {
  sku: string;
  nome: string;
  receita: number;
  unidades: number;
}

interface VendorState {
  status: "loading" | "success" | "error";
  glanceViews: GlanceViewRow[];
  topProducts: TopProduct[];
  error: string | null;
}

function pct(a: number, b: number): number {
  return b > 0 ? ((a - b) / b) * 100 : 0;
}

function GlanceViewsBars({ rows }: { rows: GlanceViewRow[] }) {
  const max = Math.max(...rows.flatMap((r) => [r.views2025 ?? 0, r.views2026 ?? 0]), 1);
  return (
    <div className="flex h-44 items-end justify-between gap-2 sm:gap-3">
      {rows.map((r) => (
        <div key={r.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <div className="flex h-36 w-full items-end justify-center gap-[3px]">
            <div
              className="w-full max-w-3 rounded-t-[3px] bg-gradient-to-t from-success/60 to-success shadow-[0_0_10px_rgba(34,197,94,0.35)] transition-all duration-300"
              style={{ height: `${Math.max(2, ((r.views2025 ?? 0) / max) * 100)}%` }}
              title={`2025: ${(r.views2025 ?? 0).toLocaleString("pt-BR")}`}
            />
            <div
              className="w-full max-w-3 rounded-t-[3px] bg-gradient-to-t from-orange-400/60 to-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.35)] transition-all duration-300"
              style={{ height: `${Math.max(2, ((r.views2026 ?? 0) / max) * 100)}%` }}
              title={`2026: ${(r.views2026 ?? 0).toLocaleString("pt-BR")}`}
            />
          </div>
          <span className="text-[10px] font-medium text-text-3">{r.label}</span>
        </div>
      ))}
    </div>
  );
}

export function AmazonVendorTab() {
  const [state, setState] = useState<VendorState>({ status: "loading", glanceViews: [], topProducts: [], error: null });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/vendor-metrics")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`);
        return json as { glanceViews: GlanceViewRow[]; topProducts: TopProduct[] };
      })
      .then((json) => {
        if (cancelled) return;
        setState({ status: "success", glanceViews: json.glanceViews, topProducts: json.topProducts, error: null });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({ status: "error", glanceViews: [], topProducts: [], error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rowsWithData = state.glanceViews.filter((r) => r.views2025 != null && r.views2026 != null);
  const total2025 = rowsWithData.reduce((s, r) => s + (r.views2025 ?? 0), 0);
  const total2026 = rowsWithData.reduce((s, r) => s + (r.views2026 ?? 0), 0);
  const totalDelta = pct(total2026, total2025);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-dashed border-border-strong bg-surface px-4 py-3.5">
        <p className="text-[12.5px] leading-relaxed text-text-2">
          Métricas específicas da Amazon Vendor (fornecedor direto) — separadas do resto do dashboard porque só
          fecham mensalmente, nunca dia a dia.
        </p>
      </div>

      {state.status === "loading" ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-[12.5px] text-text-3">
          Carregando dados da Amazon Vendor…
        </div>
      ) : state.status === "error" ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-[12.5px] text-text-3">
          Não foi possível carregar: {state.error}
        </div>
      ) : (
        <>
          <Section
            title="Glance Views — Visualizações da Página de Oferta"
            subtitle="Por mês · 2025 à esquerda, 2026 à direita · todos os ASINs, Brasil"
          >
            {rowsWithData.length === 0 ? (
              <p className="py-6 text-center text-[12.5px] text-text-3">Ainda sem dados importados.</p>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-end gap-x-8 gap-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-text-3">Acumulado 2025</p>
                    <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-text-3">
                      {total2025.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-text-3">Acumulado 2026</p>
                    <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-text-1">
                      {total2026.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Trend direction={totalDelta >= 0 ? "up" : "down"} className="text-base">
                    {totalDelta >= 0 ? "+" : "−"}
                    {Math.abs(totalDelta).toFixed(1).replace(".", ",")}%
                  </Trend>
                </div>
                <GlanceViewsBars rows={rowsWithData} />
              </>
            )}
          </Section>

          <Section title="Top Produtos" subtitle="Amazon Vendor · por mês">
            <div className="flex flex-col items-center gap-2.5 py-8 text-center">
              <PackageSearch className="h-6 w-6 text-text-3" strokeWidth={1.75} aria-hidden="true" />
              <p className="max-w-md text-[12.5px] leading-relaxed text-text-3">
                Aguardando acesso à Amazon Vendor Central — a API oficial foi recusada e está em reenvio de
                documentos. Assim que a conexão existir (Vendor ou planilha manual), os top produtos aparecem aqui.
              </p>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
