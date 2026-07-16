import { CHANNELS } from "@/data/mock-dashboard";
import { formatBRL2 } from "@/lib/format";
import type { ChannelSummary } from "@/lib/platforms/types";
import { Section } from "./Section";

interface BarRow {
  key: string;
  label: string;
  value: number;
  colorClass: string;
}

function MiniBarList({ rows, formatValue }: { rows: BarRow[]; formatValue: (v: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 0.0001);
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-[2px] ${r.colorClass}`} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-[12px] text-text-2">{r.label}</span>
            <span className="font-mono text-[12px] font-bold tabular-nums text-text-1">{formatValue(r.value)}</span>
          </div>
          <span className="block h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <span className={`block h-full rounded-full ${r.colorClass}`} style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

// Comparativo de eficiência que funciona pros 4 canais igual, independente de
// ter receita rastreada — CTR e CPC vêm direto das APIs, sem depender de
// tracking de conversão de valor (diferente de ROAS/ACOS).
export function ChannelEfficiencyChart({ summaries }: { summaries: ChannelSummary[] }) {
  if (summaries.length === 0) return null;

  const ctrRows: BarRow[] = summaries.map((s) => {
    const channel = CHANNELS.find((c) => c.id === s.channelId)!;
    return { key: s.channelId, label: channel.name, value: s.ctr * 100, colorClass: channel.color };
  });
  const cpcRows: BarRow[] = summaries.map((s) => {
    const channel = CHANNELS.find((c) => c.id === s.channelId)!;
    return { key: s.channelId, label: channel.name, value: s.cpc, colorClass: channel.color };
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Section title="CTR por Canal" subtitle="Taxa de cliques sobre impressões · quanto maior, melhor">
        <MiniBarList rows={ctrRows} formatValue={(v) => `${v.toFixed(2).replace(".", ",")}%`} />
      </Section>
      <Section title="CPC por Canal" subtitle="Custo médio por clique · quanto menor, melhor">
        <MiniBarList rows={cpcRows} formatValue={(v) => formatBRL2(v)} />
      </Section>
    </div>
  );
}
