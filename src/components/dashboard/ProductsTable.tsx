"use client";

import { useMemo, useState } from "react";
import type { ProductRow } from "@/data/mock-dashboard";
import { formatBRL, formatBRL2 } from "@/lib/format";

type SortKey = "receita" | "pedidos";

export function ProductsTable({ products }: { products: ProductRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("receita");

  const sorted = useMemo(
    () => [...products].sort((a, b) => b[sortKey] - a[sortKey]),
    [products, sortKey],
  );

  return (
    <div>
      <div className="mb-3 flex justify-end gap-1 rounded-lg border border-border bg-background p-1">
        {([
          { key: "receita", label: "Ordenar por Receita" },
          { key: "pedidos", label: "Ordenar por Pedidos" },
        ] as { key: SortKey; label: string }[]).map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setSortKey(opt.key)}
            className={`cursor-pointer rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors duration-150 ${
              sortKey === opt.key ? "bg-accent text-accent-foreground" : "text-text-2 hover:text-text-1"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {["Produto", "SKU", "Receita", "Pedidos", "Ticket Médio"].map((h, i) => (
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
            {sorted.map((p) => (
              <tr key={p.sku} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 text-[13px] font-medium text-text-1">{p.nome}</td>
                <td className="py-2.5 text-right font-mono text-[11.5px] text-text-3 tabular-nums">{p.sku}</td>
                <td className="py-2.5 text-right font-mono text-[13px] font-bold tabular-nums text-text-1">
                  {formatBRL(p.receita)}
                </td>
                <td className="py-2.5 text-right font-mono text-[13px] text-text-2 tabular-nums">{p.pedidos}</td>
                <td className="py-2.5 text-right font-mono text-[13px] text-text-2 tabular-nums">
                  {formatBRL2(p.ticketMedio)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
