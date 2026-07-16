interface StackedSegment {
  key: string;
  label: string;
  value: number;
  display: string;
  colorClass: string;
  hex: string;
}

export function StackedBar({ segments, footer }: { segments: StackedSegment[]; footer?: string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5" role="img" aria-label="Distribuição percentual por canal">
        {segments.map((s) => (
          <span
            key={s.key}
            className={`h-full first:rounded-l-full last:rounded-r-full ${s.colorClass}`}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${s.display}`}
          />
        ))}
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2.5 text-[13px]">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-[3px] ${s.colorClass}`} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-text-2">{s.label}</span>
            <span className="font-mono font-bold tabular-nums text-text-1">{s.display}</span>
          </li>
        ))}
      </ul>

      {footer && (
        <p className="mt-3 rounded-md border border-border bg-background px-3 py-2 text-[11.5px] text-text-3">
          {footer}
        </p>
      )}
    </div>
  );
}
