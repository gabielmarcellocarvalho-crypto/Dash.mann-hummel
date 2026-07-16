import type { InsightItem, InsightSeverity } from "@/data/mock-dashboard";

const SEVERITY_CLASS: Record<InsightSeverity, string> = {
  imediato: "bg-success/10 text-success-foreground border-success/20",
  urgente: "bg-danger/10 text-danger-foreground border-danger/20",
  "esta-semana": "bg-warning/10 text-warning-foreground border-warning/20",
  "90-dias": "bg-info/10 text-info-foreground border-info/20",
};

const SEVERITY_PREFIX: Record<InsightSeverity, string> = {
  imediato: "▲",
  urgente: "●",
  "esta-semana": "●",
  "90-dias": "→",
};

export function AlertsStrip({ items }: { items: InsightItem[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.id}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11.5px] font-medium ${SEVERITY_CLASS[item.severity]}`}
        >
          <span aria-hidden="true">{SEVERITY_PREFIX[item.severity]}</span>
          {item.title}
        </span>
      ))}
    </div>
  );
}
