"use client";

import { CHANNELS } from "@/data/mock-dashboard";
import { Section } from "../Section";
import { HBarChart } from "../HBarChart";
import { ChannelEfficiencyChart } from "../ChannelEfficiencyChart";
import { PlatformCampaignsTable } from "../PlatformCampaignsTable";
import { useDashboardFilters } from "../DashboardDataContext";
import { formatBRL2 } from "@/lib/format";

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2).replace(".", ",")}%`;
}

function formatRoas(value: number | null): string {
  return value !== null && value > 0 ? `${value.toFixed(2).replace(".", ",")}x` : "—";
}

export function ByChannelTab() {
  const { channels, data, periodLabel } = useDashboardFilters();

  const summaries = channels
    .map((c) => data[c].summary)
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const bestRoas = summaries.length > 0 ? Math.max(...summaries.map((s) => s.roas ?? 0)) : 0;

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

      <Section title="Performance por Canal" subtitle={`Período: ${periodLabel} · comparativo consolidado`}>
        {summaries.length === 0 ? (
          <p className="py-6 text-center text-[12.5px] text-text-3">Aguardando dados dos canais selecionados…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Canal", "Investimento", "Cliques", "CTR", "CPC Médio", "ROAS"].map((h, i) => (
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
                        {s.cliques.toLocaleString("pt-BR")}
                      </td>
                      <td className="py-3 text-right font-mono text-[13px] text-text-2 tabular-nums">
                        {formatPercent(s.ctr)}
                      </td>
                      <td className="py-3 text-right font-mono text-[13px] text-text-2 tabular-nums">
                        {formatBRL2(s.cpc)}
                      </td>
                      <td
                        className={`py-3 text-right font-mono text-[13px] tabular-nums ${
                          isLeader ? "font-bold text-accent" : s.revenueTracked ? "font-bold text-text-1" : "text-text-3"
                        }`}
                        title={s.revenueTracked ? undefined : "Sem evento de compra com valor mapeado nesta conta"}
                      >
                        {s.revenueTracked ? formatRoas(s.roas) : "sem rastreio"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <ChannelEfficiencyChart summaries={summaries} />

      <PlatformCampaignsTable />
    </div>
  );
}
