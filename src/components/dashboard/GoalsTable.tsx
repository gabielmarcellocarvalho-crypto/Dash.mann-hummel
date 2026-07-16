import type { GoalMonth } from "@/data/mock-dashboard";
import { formatBRL } from "@/lib/format";
import { Badge, type BadgeTone } from "./Badge";

function atingimentoTone(pct: number | null): BadgeTone {
  if (pct == null) return "neutral";
  if (pct >= 80) return "success";
  if (pct >= 50) return "warning";
  return "danger";
}

export function GoalsTable({ months }: { months: GoalMonth[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="border-b border-border">
            {["Mês", "Sazon.", "Meta", "Realizado", "Gap", "% Ating."].map((h, i) => (
              <th
                key={h}
                className={`whitespace-nowrap pb-2.5 text-[10.5px] font-bold uppercase tracking-wider text-text-3 ${
                  i === 0 ? "text-left" : "text-right"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {months.map((m) => {
            const gap = m.realizado != null ? m.realizado - m.meta : null;
            const pct = m.realizado != null ? Math.round((m.realizado / m.meta) * 100) : null;
            return (
              <tr key={m.month} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 text-[13px] font-medium text-text-1">{m.month}</td>
                <td className="py-2.5 text-right font-mono text-[12.5px] text-text-3 tabular-nums">
                  {m.sazonalidade}
                </td>
                <td className="py-2.5 text-right font-mono text-[12.5px] text-text-2 tabular-nums">
                  {formatBRL(m.meta)}
                </td>
                <td className="py-2.5 text-right font-mono text-[12.5px] font-semibold text-text-1 tabular-nums">
                  {m.realizado != null ? formatBRL(m.realizado) : "—"}
                </td>
                <td
                  className={`py-2.5 text-right font-mono text-[12.5px] tabular-nums ${
                    gap == null ? "text-text-3" : gap < 0 ? "text-danger-foreground" : "text-success-foreground"
                  }`}
                >
                  {gap != null ? `${gap < 0 ? "−" : "+"}${formatBRL(Math.abs(gap))}` : "—"}
                </td>
                <td className="py-2.5 text-right">
                  <Badge tone={atingimentoTone(pct)}>{pct != null ? `${pct}%` : "—"}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
