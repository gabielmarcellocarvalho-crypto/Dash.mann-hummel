import type { LucideIcon } from "lucide-react";

interface HighlightItem {
  key: string;
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
}

export function Highlights({ items }: { items: HighlightItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <item.icon className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-3">{item.label}</p>
            <p className="truncate text-[14px] font-bold text-text-1">{item.value}</p>
            <p className="truncate text-[11px] text-text-3">{item.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
