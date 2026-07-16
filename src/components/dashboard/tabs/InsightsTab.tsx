"use client";

import { useState } from "react";
import { AlertTriangle, Info, TrendingUp, X } from "lucide-react";
import { InsightAccordionItem } from "../InsightAccordion";
import { useRealInsights } from "../useRealInsights";
import type { InsightItem } from "@/lib/insights-engine";

type FilterKey = InsightItem["direction"];

export function InsightsTab() {
  const [filter, setFilter] = useState<FilterKey | null>(null);
  const insights = useRealInsights();
  const visible = filter ? insights.filter((i) => i.direction === filter) : insights;

  const counts = {
    up: insights.filter((i) => i.direction === "up").length,
    alert: insights.filter((i) => i.direction === "alert").length,
    arrow: insights.filter((i) => i.direction === "arrow").length,
  };

  const SUMMARY: { key: FilterKey; label: string; value: number; icon: typeof TrendingUp; tone: string }[] = [
    {
      key: "up",
      label: "Oportunidades",
      value: counts.up,
      icon: TrendingUp,
      tone: "text-success-foreground border-success/25 bg-success/10",
    },
    {
      key: "alert",
      label: "Alertas",
      value: counts.alert,
      icon: AlertTriangle,
      tone: "text-danger-foreground border-danger/25 bg-danger/10",
    },
    {
      key: "arrow",
      label: "Observações",
      value: counts.arrow,
      icon: Info,
      tone: "text-info-foreground border-info/25 bg-info/10",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {SUMMARY.map((item) => {
          const isActive = filter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(isActive ? null : item.key)}
              aria-pressed={isActive}
              className={`flex cursor-pointer items-center gap-3.5 rounded-lg border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${item.tone} ${
                isActive ? "ring-2 ring-accent/60" : ""
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden="true" />
              <span className="font-mono text-2xl font-bold tabular-nums">{item.value}</span>
              <span className="text-[13px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12.5px] text-text-3">
          {filter
            ? `Mostrando ${visible.length} de ${insights.length} · clique no card de novo pra limpar o filtro`
            : "Clique em um card acima pra filtrar, ou em cada item pra ver análise e ação recomendada. Gerado a partir dos dados reais do período e canais selecionados."}
        </p>
        {filter && (
          <button
            type="button"
            onClick={() => setFilter(null)}
            className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-semibold text-accent hover:text-accent-hover"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
            Limpar filtro
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {visible.map((item) => (
          <InsightAccordionItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
