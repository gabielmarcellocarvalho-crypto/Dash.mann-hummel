"use client";

import { useState } from "react";
import type { GoalMonth } from "@/data/mock-dashboard";
import { formatBRL } from "@/lib/format";

export function GoalsBarChart({ months }: { months: GoalMonth[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...months.map((m) => m.meta));

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[12px] text-text-2">
          <span className="h-2.5 w-2.5 rounded-sm border border-border-strong bg-transparent" aria-hidden="true" />
          Meta
        </span>
        <span className="flex items-center gap-1.5 text-[12px] text-text-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent" aria-hidden="true" />
          Realizado
        </span>
      </div>
      <div className="flex h-40 items-end justify-between gap-1.5 sm:gap-2.5">
        {months.map((m, i) => {
          const metaPct = Math.min(100, (m.meta / max) * 100);
          const realizadoPct = m.realizado != null ? Math.min(100, (m.realizado / max) * 100) : 0;
          const isHover = hover === i;
          const pctDaMeta = m.realizado != null && m.meta > 0 ? (m.realizado / m.meta) * 100 : null;

          return (
            <div
              key={m.month}
              className="relative flex flex-1 flex-col items-center gap-1.5"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((v) => (v === i ? null : v))}
            >
              {isHover && (
                <div
                  className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-10 w-max -translate-x-1/2 rounded-lg border border-border-strong bg-surface-2 px-3 py-2 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.6)]"
                  role="tooltip"
                >
                  <p className="mb-1 text-[11px] font-semibold text-text-1">{m.month}</p>
                  <p className="flex items-center gap-1.5 text-[11.5px] text-text-2">
                    <span className="h-1.5 w-1.5 rounded-full border border-text-3" aria-hidden="true" />
                    Meta: <span className="font-mono font-semibold text-text-1">{formatBRL(m.meta)}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-[11.5px] text-text-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                    Realizado:{" "}
                    <span className="font-mono font-semibold text-text-1">
                      {m.realizado != null ? formatBRL(m.realizado) : "—"}
                    </span>
                  </p>
                  {pctDaMeta !== null && (
                    <p className={`mt-0.5 text-[11px] ${pctDaMeta >= 100 ? "text-success-foreground" : "text-text-3"}`}>
                      {pctDaMeta.toFixed(0)}% da meta do mês
                    </p>
                  )}
                </div>
              )}
              <div
                className={`relative flex h-32 w-full max-w-7 items-end justify-center rounded-t-[3px] border border-dashed bg-transparent transition-colors duration-150 ${
                  isHover ? "border-accent/70" : "border-border-strong/80"
                }`}
              >
                <div
                  className="w-full rounded-t-[3px] bg-gradient-to-t from-accent/60 to-accent shadow-[0_0_12px_var(--color-accent-glow)] transition-all duration-300"
                  style={{ height: `${Math.max(realizadoPct, m.realizado ? 3 : 0)}%` }}
                  aria-hidden="true"
                />
                <span
                  className="absolute inset-x-0 border-t border-dashed border-text-2"
                  style={{ bottom: `${metaPct}%` }}
                  aria-hidden="true"
                />
              </div>
              <span className={`text-[10.5px] font-medium ${isHover ? "text-text-1" : "text-text-3"}`}>{m.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
