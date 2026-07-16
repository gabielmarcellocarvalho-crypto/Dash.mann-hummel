"use client";

import { useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react";
import { CHANNELS } from "@/data/mock-dashboard";
import { Section } from "./Section";
import { formatBRL2 } from "@/lib/format";
import { useDashboardFilters } from "./DashboardDataContext";
import type { CampaignRow, ChannelId } from "@/lib/platforms/types";

const STATUS_LABEL: Record<string, string> = {
  ENABLED: "Ativa",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  ARCHIVED: "Arquivada",
  active: "Ativa",
  paused: "Pausada",
};

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${(value * 100).toFixed(2).replace(".", ",")}%`;
}

function formatRoas(value: number | null): string {
  if (value === null || value === 0) return "—";
  return `${value.toFixed(2).replace(".", ",")}x`;
}

const CHANNEL_PERIOD_NOTE: Partial<Record<ChannelId, string>> = {
  amazon: "limitado a 60 dias pela Amazon",
};

type SortKey = "clicks" | "impressions" | "ctr" | "cpc" | "cost" | "roas" | "acos" | "revenue";

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: "clicks", label: "Cliques" },
  { key: "impressions", label: "Impr." },
  { key: "ctr", label: "CTR" },
  { key: "cpc", label: "CPC" },
  { key: "cost", label: "Custo" },
  { key: "roas", label: "ROAS" },
  { key: "acos", label: "ACOS" },
  { key: "revenue", label: "Receita" },
];

function sortValue(c: CampaignRow, key: SortKey): number {
  const v = c[key];
  return v ?? -Infinity;
}

export function PlatformCampaignsTable() {
  const { channels, data, periodLabel } = useDashboardFilters();
  const [sortKey, setSortKey] = useState<SortKey>("cost");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const loadingChannels = channels.filter((c) => data[c].status === "loading");
  const errorChannels = channels.filter((c) => data[c].status === "error");
  const readyChannels = channels.filter((c) => data[c].status === "success");

  const campaigns = readyChannels
    .flatMap((c) => data[c].campaigns)
    .sort((a, b) => {
      const diff = sortValue(a, sortKey) - sortValue(b, sortKey);
      return sortDir === "desc" ? -diff : diff;
    })
    .slice(0, 40);

  const sortColumnLabel = SORT_COLUMNS.find((s) => s.key === sortKey)!.label;

  return (
    <Section
      title="Campanhas (dados reais)"
      subtitle={`Período: ${periodLabel} · fonte: APIs nativas (MELI, Google, Meta) + Windsor.ai (Amazon)`}
    >
      {loadingChannels.length > 0 && (
        <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-border bg-background px-3.5 py-2.5 text-[12px] text-text-3">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
          Buscando dados de {loadingChannels.map((c) => CHANNELS.find((ch) => ch.id === c)!.name).join(", ")}
          {loadingChannels.includes("amazon") && " — a Amazon pode levar mais de um minuto"}…
        </div>
      )}

      {errorChannels.map((c) => {
        const channel = CHANNELS.find((ch) => ch.id === c)!;
        return (
          <div
            key={c}
            className="mb-3 flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-3 text-[12.5px] leading-snug text-text-1"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
            <span>
              Falha ao buscar dados de {channel.name}: {data[c].error}
            </span>
          </div>
        );
      })}

      {campaigns.length === 0 && loadingChannels.length === 0 ? (
        <p className="py-6 text-center text-[12.5px] text-text-3">
          Nenhuma campanha encontrada para os canais e período selecionados.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="whitespace-nowrap px-2 pb-2.5 text-left text-[10.5px] font-bold uppercase tracking-wider text-text-3">
                  Canal
                </th>
                <th className="whitespace-nowrap px-2 pb-2.5 text-left text-[10.5px] font-bold uppercase tracking-wider text-text-3">
                  Campanha
                </th>
                <th className="whitespace-nowrap px-2 pb-2.5 text-right text-[10.5px] font-bold uppercase tracking-wider text-text-3">
                  Status
                </th>
                {SORT_COLUMNS.map((col) => {
                  const isActive = sortKey === col.key;
                  const Icon = isActive ? (sortDir === "desc" ? ArrowDown : ArrowUp) : ArrowUpDown;
                  return (
                    <th
                      key={col.key}
                      className="whitespace-nowrap px-2 pb-2.5 text-right text-[10.5px] font-bold uppercase tracking-wider text-text-3"
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className={`inline-flex cursor-pointer items-center gap-1 transition-colors duration-150 hover:text-text-1 ${
                          isActive ? "text-accent" : ""
                        }`}
                        aria-label={`Ordenar por ${col.label}`}
                      >
                        {col.label}
                        <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const channel = CHANNELS.find((ch) => ch.id === c.channelId)!;
                return (
                  <tr key={`${c.channelId}-${c.campaignId}`} className="border-b border-border/60 last:border-0">
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex h-2.5 w-2.5 rounded-[3px] ${channel.color}`}
                        aria-label={channel.name}
                        title={`${channel.name}${CHANNEL_PERIOD_NOTE[c.channelId] ? ` (${CHANNEL_PERIOD_NOTE[c.channelId]})` : ""}`}
                      />
                    </td>
                    <td className="max-w-[220px] truncate px-2 py-3 text-[12.5px] font-medium text-text-1" title={c.campaign}>
                      {c.campaign}
                    </td>
                    <td className="px-2 py-3 text-right text-[12px] text-text-2">
                      {c.status ? (STATUS_LABEL[c.status] ?? c.status) : "—"}
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-[12.5px] text-text-2 tabular-nums">
                      {c.clicks.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-[12.5px] text-text-2 tabular-nums">
                      {c.impressions.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-[12.5px] text-text-2 tabular-nums">
                      {formatPercent(c.ctr)}
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-[12.5px] text-text-2 tabular-nums">
                      {c.cpc !== null ? formatBRL2(c.cpc) : "—"}
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-[12.5px] text-text-2 tabular-nums">
                      {formatBRL2(c.cost)}
                    </td>
                    <td
                      className={`px-2 py-3 text-right font-mono text-[13px] tabular-nums ${
                        c.revenueTracked ? "font-bold text-text-1" : "text-text-3"
                      }`}
                      title={c.revenueTracked ? undefined : "Sem evento de compra com valor mapeado nesta conta"}
                    >
                      {c.revenueTracked ? formatRoas(c.roas) : "sem rastreio"}
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-[12.5px] text-text-2 tabular-nums">
                      {c.revenueTracked ? formatPercent(c.acos) : "—"}
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-[12.5px] text-text-2 tabular-nums">
                      {c.revenueTracked ? formatBRL2(c.revenue) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {campaigns.length === 40 && (
            <p className="mt-3 text-center text-[11px] text-text-3">
              Mostrando as 40 campanhas com {sortDir === "desc" ? "maior" : "menor"} {sortColumnLabel.toLowerCase()}{" "}
              no período.
            </p>
          )}
          {campaigns.some((c) => !c.revenueTracked) && (
            <p className="mt-3 text-[11px] leading-snug text-text-3">
              &ldquo;sem rastreio&rdquo; = essa plataforma não tem evento de compra com valor configurado nesta
              conta — não é o mesmo que ROAS zero, é ausência de dado.
            </p>
          )}
        </div>
      )}
    </Section>
  );
}
