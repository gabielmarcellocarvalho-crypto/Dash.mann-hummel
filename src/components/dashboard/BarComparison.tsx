import { CHANNELS, type InvestRevenue } from "@/data/mock-dashboard";
import { formatCompactBRL } from "@/lib/format";

export function BarComparison({ data }: { data: InvestRevenue[] }) {
  const max = Math.max(...data.flatMap((d) => [d.investimento, d.receita]));

  return (
    <div>
      <div className="mb-5 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[12px] text-text-2">
          <span className="h-2.5 w-2.5 rounded-[3px] border border-dashed border-text-3" aria-hidden="true" />
          Investimento
        </span>
        <span className="flex items-center gap-1.5 text-[12px] text-text-2">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-accent shadow-[0_0_8px_var(--color-accent-glow)]" aria-hidden="true" />
          Receita
        </span>
      </div>

      <div className="flex h-48 items-end justify-between gap-3 sm:gap-6">
        {data.map((row) => {
          const channel = CHANNELS.find((c) => c.id === row.channelId)!;
          const investPct = (row.investimento / max) * 100;
          const receitaPct = (row.receita / max) * 100;
          return (
            <div key={row.channelId} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end justify-center gap-2">
                <div className="flex h-full w-full max-w-7 flex-col items-center justify-end">
                  <span className="mb-1 text-[10px] font-semibold text-text-3 tabular-nums">
                    {formatCompactBRL(row.investimento)}
                  </span>
                  <div
                    className="w-full rounded-t-[3px] border border-dashed border-text-3/60 bg-white/[0.03] transition-all duration-300"
                    style={{ height: `${Math.max(investPct, 3)}%` }}
                  />
                </div>
                <div className="flex h-full w-full max-w-7 flex-col items-center justify-end">
                  <span className="mb-1 text-[10px] font-bold text-accent tabular-nums">
                    {formatCompactBRL(row.receita)}
                  </span>
                  <div
                    className="w-full rounded-t-[3px] bg-gradient-to-t from-accent/60 to-accent shadow-[0_0_16px_var(--color-accent-glow)] transition-all duration-300"
                    style={{ height: `${Math.max(receitaPct, 3)}%` }}
                  />
                </div>
              </div>
              <span className="text-[12px] font-medium text-text-2">{channel.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
