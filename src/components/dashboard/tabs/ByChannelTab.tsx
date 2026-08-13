"use client";

import { CHANNELS } from "@/data/mock-dashboard";
import { Section } from "../Section";
import { HBarChart } from "../HBarChart";
import { PlatformCampaignsTable } from "../PlatformCampaignsTable";
import { MetaCreativesGrid } from "../MetaCreativesGrid";
import { useDashboardFilters } from "../DashboardDataContext";
import { formatBRL2 } from "@/lib/format";
import type { ChannelSummary } from "@/lib/platforms/types";

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2).replace(".", ",")}%`;
}

function formatRoas(value: number | null): string {
  return value !== null && value > 0 ? `${value.toFixed(2).replace(".", ",")}x` : "—";
}

function formatAcos(value: number | null): string {
  return value !== null && value > 0 ? formatPercent(value) : "—";
}

// Marketplaces (MELI/Amazon) têm venda e receita atribuída reais — métricas
// de eficiência de compra fazem sentido (ROAS, ACOS, nº de vendas). CTR/CPC
// não entram aqui: são pedido explícito da Maria pra tirar da visão de
// marketplace (só fazem sentido pra Google/Meta, que são topo de funil).
function MarketplacesTable({ summaries }: { summaries: ChannelSummary[] }) {
  if (summaries.length === 0) return null;
  const bestRoas = Math.max(...summaries.map((s) => s.roas ?? 0));

  return (
    <Section title="Métricas de Amazon Ads e Meli Ads" subtitle="Marketplaces · investimento, receita e eficiência de venda">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {["Canal", "Investimento", "Receita", "ROAS", "ACOS", "Cliques", "Impressões", "Nº Vendas"].map((h, i) => (
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
            {summaries.map((s) => {
              const channel = CHANNELS.find((c) => c.id === s.channelId)!;
              const isLeader = s.roas === bestRoas && bestRoas > 0;
              return (
                <tr key={s.channelId} className="border-b border-border/60 last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-[3px] ${channel.color}`} aria-hidden="true" />
                      <div>
                        <p className="text-[13px] font-semibold text-text-1">{channel.name}</p>
                        <p className="text-[10.5px] text-text-3">{channel.tag}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono text-[13px] text-text-2 tabular-nums">
                    {formatBRL2(s.investimento)}
                  </td>
                  <td className="py-3 text-right font-mono text-[13px] text-text-2 tabular-nums">
                    {formatBRL2(s.receita)}
                  </td>
                  <td
                    className={`py-3 text-right font-mono text-[13px] tabular-nums ${
                      isLeader ? "font-bold text-accent" : "font-bold text-text-1"
                    }`}
                  >
                    {formatRoas(s.roas)}
                  </td>
                  <td className="py-3 text-right font-mono text-[13px] text-text-2 tabular-nums">{formatAcos(s.acos)}</td>
                  <td className="py-3 text-right font-mono text-[13px] text-text-2 tabular-nums">
                    {s.cliques.toLocaleString("pt-BR")}
                  </td>
                  <td className="py-3 text-right font-mono text-[13px] text-text-2 tabular-nums">
                    {s.impressoes.toLocaleString("pt-BR")}
                  </td>
                  <td className="py-3 text-right font-mono text-[13px] text-text-2 tabular-nums">
                    {s.units.toLocaleString("pt-BR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// Google/Meta são topo de funil nesta conta (sem evento de compra com valor
// mapeado) — aqui CTR ainda importa, mas ROAS/ACOS/receita não são exibidos
// como número (ver REVENUE_TRACKED em platforms/types.ts).
function TrafficAdsTable({ summaries }: { summaries: ChannelSummary[] }) {
  if (summaries.length === 0) return null;

  return (
    <Section title="Google Ads e Meta Ads" subtitle="Tráfego pago · sem venda atribuída direta nesta conta">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {["Canal", "Investimento", "Cliques", "Impressões", "CTR"].map((h, i) => (
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
            {summaries.map((s) => {
              const channel = CHANNELS.find((c) => c.id === s.channelId)!;
              return (
                <tr key={s.channelId} className="border-b border-border/60 last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-[3px] ${channel.color}`} aria-hidden="true" />
                      <div>
                        <p className="text-[13px] font-semibold text-text-1">{channel.name}</p>
                        <p className="text-[10.5px] text-text-3">{channel.tag}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono text-[13px] text-text-2 tabular-nums">
                    {formatBRL2(s.investimento)}
                  </td>
                  <td className="py-3 text-right font-mono text-[13px] text-text-2 tabular-nums">
                    {s.cliques.toLocaleString("pt-BR")}
                  </td>
                  <td className="py-3 text-right font-mono text-[13px] text-text-2 tabular-nums">
                    {s.impressoes.toLocaleString("pt-BR")}
                  </td>
                  <td className="py-3 text-right font-mono text-[13px] text-text-2 tabular-nums">
                    {formatPercent(s.ctr)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function ByChannelTab() {
  const { channels, data, periodLabel } = useDashboardFilters();

  const summaries = channels
    .map((c) => data[c].summary)
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const marketplaceSummaries = summaries.filter((s) => s.revenueTracked);
  const trafficSummaries = summaries.filter((s) => !s.revenueTracked);

  return (
    <div className="flex flex-col gap-4">
      <Section title="Investimento por Canal" subtitle={`Período: ${periodLabel} · dados reais`}>
        {summaries.length === 0 ? (
          <p className="py-6 text-center text-[12.5px] text-text-3">Aguardando dados dos canais selecionados…</p>
        ) : (
          <HBarChart
            rows={summaries.map((s) => {
              const channel = CHANNELS.find((c) => c.id === s.channelId)!;
              return { key: s.channelId, label: channel.name, value: s.investimento, colorClass: channel.color };
            })}
          />
        )}
      </Section>

      <MarketplacesTable summaries={marketplaceSummaries} />
      <TrafficAdsTable summaries={trafficSummaries} />

      {channels.includes("meta") && <MetaCreativesGrid />}

      <PlatformCampaignsTable />
    </div>
  );
}
