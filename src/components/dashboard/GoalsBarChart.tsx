import type { GoalMonth } from "@/data/mock-dashboard";

export function GoalsBarChart({ months }: { months: GoalMonth[] }) {
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
        {months.map((m) => {
          const metaPct = Math.min(100, (m.meta / max) * 100);
          const realizadoPct = m.realizado != null ? Math.min(100, (m.realizado / max) * 100) : 0;
          return (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="relative flex h-32 w-full max-w-7 items-end justify-center rounded-t-[3px] border border-dashed border-border-strong/80 bg-transparent">
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
              <span className="text-[10.5px] font-medium text-text-3">{m.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
