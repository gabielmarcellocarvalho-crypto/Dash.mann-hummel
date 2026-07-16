"use client";

import { useState } from "react";
import { CHANNELS, metas2026 } from "@/data/mock-dashboard";
import { formatBRL } from "@/lib/format";
import { Badge } from "../Badge";
import { Section } from "../Section";
import { GoalsBarChart } from "../GoalsBarChart";
import { GoalsTable } from "../GoalsTable";

export function GoalsTab() {
  const [selected, setSelected] = useState(metas2026[0].channelId);
  const goal = metas2026.find((g) => g.channelId === selected)!;
  const percentNum = parseFloat(goal.percentualMeta.replace(",", "."));
  const channel = CHANNELS.find((c) => c.id === selected)!;
  const onTrack = percentNum >= 20;

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
            <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-text-1">
              {formatBRL(goal.metaAnual)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-3">Realizado Jan–Abr</p>
            <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-text-1">{goal.realizado}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-3">% da Meta</p>
            <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-accent">{goal.percentualMeta}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-3">Gap Restante</p>
            <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-text-1">{goal.gapRestante}</p>
          </div>
        </div>

        <div className="mb-1.5 flex items-center justify-between text-[10.5px] text-text-3">
          <span>R$ 0</span>
          <span>Meta: {formatBRL(goal.metaAnual)}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${Math.min(100, percentNum)}%` }}
          />
        </div>
      </div>

      <Section title="Meta vs Realizado por Mês">
        <GoalsBarChart months={goal.months} />
      </Section>

      <Section title="Detalhamento Mensal">
        <GoalsTable months={goal.months} />
      </Section>
    </div>
  );
}
