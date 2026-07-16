export interface Comparison {
  direction: "up" | "down" | "neutral";
  label: string; // ex: "+18%", "−7%", "estável", "novo"
}

// Compara valor atual com o período anterior equivalente — só isso, nada de
// fabricar tendência sem uma segunda medição real por trás.
export function compare(current: number, previous: number): Comparison | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { direction: "up", label: "novo" };

  const change = (current - previous) / previous;
  if (Math.abs(change) < 0.01) return { direction: "neutral", label: "estável" };

  const pct = Math.abs(change * 100);
  const pctLabel = pct >= 100 ? pct.toFixed(0) : pct.toFixed(1).replace(".", ",");
  return { direction: change > 0 ? "up" : "down", label: `${change > 0 ? "+" : "−"}${pctLabel}%` };
}
