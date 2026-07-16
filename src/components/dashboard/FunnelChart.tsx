interface FunnelStage {
  key: string;
  label: string;
  value: number;
  display: string;
}

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = stages[0]?.value || 1;

  return (
    <div className="flex flex-col gap-4">
      {stages.map((stage, i) => {
        const widthPct = max > 0 ? Math.max((stage.value / max) * 100, stage.value > 0 ? 2 : 0) : 0;
        const prev = i > 0 ? stages[i - 1] : null;
        const convRate = prev && prev.value > 0 ? (stage.value / prev.value) * 100 : null;

        return (
          <div key={stage.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="text-[12.5px] text-text-2">{stage.label}</span>
              <span className="font-mono text-[14px] font-bold tabular-nums text-text-1">{stage.display}</span>
            </div>
            <div className="h-7 w-full overflow-hidden rounded-md bg-white/5">
              <div
                className="h-full rounded-md bg-accent transition-all duration-500"
                style={{ width: `${widthPct}%` }}
              />
            </div>
            {convRate !== null && (
              <p className="mt-1 text-[10.5px] text-text-3">
                {convRate.toFixed(2).replace(".", ",")}% do estágio anterior
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
