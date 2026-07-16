import type { DateRange, Period } from "./types";

export function periodDays(period: Period): number {
  return { "7d": 7, "14d": 14, "30d": 30, "90d": 90 }[period];
}

function fmt(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayStr(): string {
  return fmt(new Date());
}

// Intervalo [dateFrom, dateTo] inclusive, em horário UTC — suficiente para
// relatórios diários das APIs de ads (nenhuma delas expõe granularidade de hora aqui).
export function periodDateRange(period: Period): DateRange {
  const days = periodDays(period);
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - (days - 1));
  return { dateFrom: fmt(from), dateTo: fmt(to) };
}

const WINDSOR_MAX_LOOKBACK_DAYS = 60;

// Amazon (via Windsor) só disponibiliza os últimos 60 dias de relatório —
// datas mais antigas que isso são recortadas só para essa plataforma.
export function clampRangeForWindsor(range: DateRange): DateRange {
  const minFrom = new Date();
  minFrom.setUTCDate(minFrom.getUTCDate() - (WINDSOR_MAX_LOOKBACK_DAYS - 1));
  const minFromStr = fmt(minFrom);
  return {
    dateFrom: range.dateFrom < minFromStr ? minFromStr : range.dateFrom,
    dateTo: range.dateTo,
  };
}

// Período imediatamente anterior, com a mesma duração — usado pra comparação
// real (ex.: "últimos 30 dias" vs "30 dias anteriores"), não fabricada.
export function previousEquivalentRange(range: DateRange): DateRange {
  const from = new Date(`${range.dateFrom}T00:00:00Z`);
  const to = new Date(`${range.dateTo}T00:00:00Z`);
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;

  const prevTo = new Date(from);
  prevTo.setUTCDate(prevTo.getUTCDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setUTCDate(prevFrom.getUTCDate() - (days - 1));

  return { dateFrom: fmt(prevFrom), dateTo: fmt(prevTo) };
}

export function rangeLabel(range: DateRange): string {
  const [, fm, fd] = range.dateFrom.split("-");
  const [ty, tm, td] = range.dateTo.split("-");
  return `${fd}/${fm} – ${td}/${tm}/${ty}`;
}
