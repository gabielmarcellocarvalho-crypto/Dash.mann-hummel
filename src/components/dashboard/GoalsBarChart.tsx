"use client";

import { useState } from "react";
import type { GoalMonth } from "@/data/mock-dashboard";
import { formatBRL } from "@/lib/format";

// Barras lado a lado (Meta x Realizado) por mês — pedido explícito da Maria
// em 12/08: a versão anterior (meta como linha tracejada + uma barra) "não é
// muito interessante", ela quer duas barras visíveis por mês.
export function GoalsBarChart({ months }: { months: GoalMonth[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...months.map((m) => Math.max(m.meta, m.realizado ?? 0)), 1);

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[12px] text-text-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-success" aria-hidden="true" />
          Meta
        </span>
        <span className="flex items-center gap-1.5 text-[12px] text-text-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent" aria-hidden="true" />
          Realizado
        </span>
      </div>
      <div className="flex h-40 items-end justify-between gap-2 sm:gap-3">
        {months.map((m, i) => {
          const metaPct = Math.max(2, (m.meta / max) * 100);
          const realizadoPct = m.realizado != null ? Math.max(2, (m.realizado / max) * 100) : 0;
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
                    <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
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
              <div className="flex h-32 w-full items-end justify-center gap-[3px]">
                <div
                  className="w-full max-w-3.5 rounded-t-[3px] bg-gradient-to-t from-success/60 to-success shadow-[0_0_10px_rgba(34,197,94,0.35)] transition-all duration-300"
                  style={{ height: `${metaPct}%` }}
                  aria-hidden="true"
                />
                <div
                  className="w-full max-w-3.5 rounded-t-[3px] bg-gradient-to-t from-accent/60 to-accent shadow-[0_0_12px_var(--color-accent-glow)] transition-all duration-300"
                  style={{ height: `${realizadoPct}%` }}
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
