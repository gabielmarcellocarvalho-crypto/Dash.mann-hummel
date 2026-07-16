import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { Kpi } from "@/data/mock-dashboard";

interface KpiCardProps extends Kpi {
  icon: LucideIcon;
}

const PILL_TONE = {
  up: "bg-success/10 text-success-foreground",
  down: "bg-danger/10 text-danger-foreground",
  neutral: "bg-white/5 text-text-2",
} as const;

const TREND_ICON = { up: ArrowUp, down: ArrowDown };

export function KpiCard({ label, value, note, trend = "neutral", icon: Icon }: KpiCardProps) {
  const TrendIcon = trend !== "neutral" ? TREND_ICON[trend] : null;

  return (
    <div className="group rounded-lg border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_10px_28px_-12px_var(--color-accent-glow)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium text-text-3 transition-colors duration-200 group-hover:text-text-2">
          {label}
        </p>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent transition-all duration-200 group-hover:scale-110 group-hover:bg-accent group-hover:text-accent-foreground">
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </div>
      <p className="font-sans text-2xl font-bold tracking-tight text-text-1 tabular-nums transition-colors duration-200 group-hover:text-accent">
        {value}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {TrendIcon && (
          <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold ${PILL_TONE[trend]}`}>
            <TrendIcon className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
          </span>
        )}
        <span className="text-[11.5px] text-text-3">{note}</span>
      </div>
    </div>
  );
}

export function KpiGrid({ items }: { items: KpiCardProps[] }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </div>
  );
}
