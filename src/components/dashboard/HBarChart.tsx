import { formatCompactBRL } from "@/lib/format";

interface HBarRow {
  key: string;
  label: string;
  value: number;
  colorClass: string;
}

export function HBarChart({ rows }: { rows: HBarRow[] }) {
  const max = Math.max(...rows.map((r) => r.value));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  return (
    <div>
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-[12.5px] text-text-2 sm:w-36">{r.label}</span>
            <div className="relative h-6 flex-1">
              <div
                className={`absolute inset-y-0 left-0 rounded-r-sm ${r.colorClass} transition-all duration-300`}
                style={{ width: `${(r.value / max) * 100}%` }}
              />
              <span className="absolute inset-y-0 flex items-center pl-2 font-mono text-[11px] font-bold text-text-1 tabular-nums" style={{ left: `${(r.value / max) * 100}%` }}>
                {formatCompactBRL(r.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between border-t border-border pl-[7.5rem] pt-2 sm:pl-[9.5rem]">
        {ticks.map((t, i) => (
          <span key={i} className="text-[10px] text-text-3 tabular-nums">
            {formatCompactBRL(t)}
          </span>
        ))}
      </div>
    </div>
  );
}
