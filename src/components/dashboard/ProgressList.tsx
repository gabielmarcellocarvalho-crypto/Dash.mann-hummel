interface ProgressRow {
  key: string;
  label: string;
  display: string;
  secondary?: string;
  percent: number; // 0-100, para a largura da barra
  colorClass: string; // classe tailwind bg-*
}

export function ProgressList({ rows }: { rows: ProgressRow[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="mb-1.5 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-[3px] ${row.colorClass}`} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-[13px] text-text-2">{row.label}</span>
            <span className="font-mono text-[13px] font-bold tabular-nums text-text-1">{row.display}</span>
            {row.secondary && (
              <span className="font-mono text-[11.5px] tabular-nums text-text-3">{row.secondary}</span>
            )}
          </div>
          <span className="block h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <span
              className={`block h-full rounded-full ${row.colorClass}`}
              style={{ width: `${Math.min(100, row.percent)}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
