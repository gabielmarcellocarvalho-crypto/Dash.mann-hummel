export function formatCompactBRL(value: number): string {
  if (value >= 1000) {
    const thousands = value / 1000;
    const formatted = thousands >= 100 ? thousands.toFixed(0) : thousands.toFixed(1).replace(".", ",");
    return `R$${formatted}k`;
  }
  return `R$${value.toFixed(0)}`;
}

export function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}

export function formatBRL2(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
