"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { CHANNELS, yoyBanner, yoyNarrativa, yoyPorCanal } from "@/data/mock-dashboard";
import { Trend } from "../Trend";
import { Section } from "../Section";

export function YearOverYearTab() {
  const [selected, setSelected] = useState(yoyPorCanal[0].channelId);
  const row = yoyPorCanal.find((r) => r.channelId === selected)!;
  const channel = CHANNELS.find((c) => c.id === selected)!;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border-strong bg-surface px-4 py-3.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-text-3" strokeWidth={2} aria-hidden="true" />
        <p className="text-[12.5px] leading-relaxed text-text-2">{yoyBanner}</p>
      </div>

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

      <Section title={`${channel.name} · 2026 vs 2025`} subtitle={row.nota}>
        <table className="w-full border-collapse">
          <tbody>
            {row.metrics.map((m) => (
              <tr key={m.label} className="border-b border-dashed border-border last:border-0">
                <td className="py-3 text-[13px] text-text-2">{m.label}</td>
                <td className="py-3 text-right font-mono text-[15px] font-bold tabular-nums text-text-1">
                  {m.value}
                </td>
                <td className="py-3 pl-4 text-right">
                  <Trend direction={m.positive ? "up" : "down"}>{m.change}</Trend>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-text-3">
          O Que os Números Realmente Dizem
        </h2>
        <ul className="flex flex-col gap-3.5">
          {yoyNarrativa.map((n, i) => (
            <li key={i} className="flex gap-3">
              <span aria-hidden="true" className={`mt-0.5 w-1 shrink-0 rounded-full ${n.color}`} />
              <p className="text-[13px] leading-relaxed text-text-1">{n.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
