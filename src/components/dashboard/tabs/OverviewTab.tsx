"use client";

import { Award, MousePointerClick, MousePointer, Percent, Target, TrendingUp, Wallet, Zap } from "lucide-react";
import { KpiGrid } from "../KpiCard";
import { Section } from "../Section";
import { AreaLineChart } from "../AreaLineChart";
import { StackedBar } from "../StackedBar";
import { ProgressList } from "../ProgressList";
import { AlertsStrip } from "../AlertsStrip";
import { Highlights } from "../Highlights";
import { ProductsTable } from "../ProductsTable";
import { CHANNELS, topProdutos } from "@/data/mock-dashboard";
import { formatBRL2 } from "@/lib/format";
import { compare } from "@/lib/compare";
import { useDailyTrend } from "@/lib/use-daily-trend";
import { useDashboardFilters } from "../DashboardDataContext";
import { useRealInsights } from "../useRealInsights";

export function OverviewTab() {
  const { channels, data, previousData, range, periodLabel } = useDashboardFilters();
  const insights = useRealInsights();
  const dailyTrend = useDailyTrend(range, channels);

  const summaries = channels
    .map((c) => data[c].summary)
    .filter((s): s is NonNullable<typeof s> => s !== null);
  const previousSummaries = channels
    .map((c) => previousData[c].summary)
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const loading = channels.some((c) => data[c].status === "loading");

  // ROAS/receita só existem de verdade para canais com revenueTracked === true
  // (MELI e Amazon, que reportam vendas reais). Google e Meta não têm evento de
  // compra com valor mapeado nesta conta — misturar o "investimento" deles com
  // a "receita" de quem tem rastreamento real inflaria/distorceria o ROAS médio.
  const revenueSummaries = summaries.filter((s) => s.revenueTracked);
  const noRevenueSummaries = summaries.filter((s) => !s.revenueTracked);
  const previousRevenueSummaries = previousSummaries.filter((s) => s.revenueTracked);

  const totalInvestimento = summaries.reduce((sum, s) => sum + s.investimento, 0);
  const totalReceita = revenueSummaries.reduce((sum, s) => sum + s.receita, 0);
  const investimentoComReceita = revenueSummaries.reduce((sum, s) => sum + s.investimento, 0);
  const totalCliques = summaries.reduce((sum, s) => sum + s.cliques, 0);
  const totalImpressoes = summaries.reduce((sum, s) => sum + s.impressoes, 0);
  const roasMedio = investimentoComReceita > 0 ? totalReceita / investimentoComReceita : 0;
  const cpcMedio = totalCliques > 0 ? totalInvestimento / totalCliques : 0;

  // Comparação real com o período anterior de mesma duração — só isso justifica
  // uma seta de tendência; nunca fabricamos "up/down" sem uma segunda medição.
  const previousTotalInvestimento = previousSummaries.reduce((sum, s) => sum + s.investimento, 0);
  const previousTotalReceita = previousRevenueSummaries.reduce((sum, s) => sum + s.receita, 0);
  const previousInvestimentoComReceita = previousRevenueSummaries.reduce((sum, s) => sum + s.investimento, 0);
  const previousTotalCliques = previousSummaries.reduce((sum, s) => sum + s.cliques, 0);
  const previousRoasMedio = previousInvestimentoComReceita > 0 ? previousTotalReceita / previousInvestimentoComReceita : 0;
  const previousCpcMedio = previousTotalCliques > 0 ? previousTotalInvestimento / previousTotalCliques : 0;

  const hasPreviousData = previousSummaries.length > 0;
  const investimentoCompare = hasPreviousData ? compare(totalInvestimento, previousTotalInvestimento) : null;
  const receitaCompare = hasPreviousData ? compare(totalReceita, previousTotalReceita) : null;
  const roasCompare = hasPreviousData ? compare(roasMedio, previousRoasMedio) : null;
  const cliquesCompare = hasPreviousData ? compare(totalCliques, previousTotalCliques) : null;
  const cpcCompare = hasPreviousData ? compare(cpcMedio, previousCpcMedio) : null;

  const bestRoasSummary = revenueSummaries.reduce<typeof summaries[number] | null>(
    (best, s) => (best === null || (s.roas ?? 0) > (best.roas ?? 0) ? s : best),
    null,
  );
  const topBudgetSummary = summaries.reduce<typeof summaries[number] | null>(
    (top, s) => (top === null || s.investimento > top.investimento ? s : top),
    null,
  );
  const bestCtrSummary = summaries.reduce<typeof summaries[number] | null>(
    (best, s) => (best === null || s.ctr > best.ctr ? s : best),
    null,
  );

  const channelName = (id: string) => CHANNELS.find((c) => c.id === id)!.name;

  const receitaNote =
    revenueSummaries.length > 0
      ? `${revenueSummaries.map((s) => channelName(s.channelId)).join(" + ")} (únicos com rastreamento)`
      : "nenhum canal selecionado tem rastreamento de receita";

  const compareNote = (c: ReturnType<typeof compare>, fallback: string) =>
    c ? `${c.label} vs período anterior` : fallback;

  const overviewKpis: { label: string; value: string; note: string; trend: "up" | "down" | "neutral" }[] = [
    {
      label: "Investimento Total",
      value: formatBRL2(totalInvestimento),
      note: compareNote(investimentoCompare, `${summaries.length} canais ativos`),
      trend: investimentoCompare?.direction ?? "neutral",
    },
    {
      label: "Receita Atribuída",
      value: formatBRL2(totalReceita),
      note: compareNote(receitaCompare, receitaNote),
      trend: receitaCompare?.direction ?? "neutral",
    },
    {
      label: "ROAS Médio",
      value: roasMedio > 0 ? `${roasMedio.toFixed(2).replace(".", ",")}x` : "—",
      note: compareNote(roasCompare, "Só canais com receita rastreada"),
      trend: roasCompare?.direction ?? "neutral",
    },
    {
      label: "Melhor ROAS",
      value: bestRoasSummary && (bestRoasSummary.roas ?? 0) > 0 ? `${bestRoasSummary.roas!.toFixed(2).replace(".", ",")}x` : "—",
      note: bestRoasSummary ? channelName(bestRoasSummary.channelId) : "—",
      trend: "neutral" as const,
    },
    {
      label: "Total de Cliques",
      value: totalCliques.toLocaleString("pt-BR"),
      note: compareNote(cliquesCompare, `${totalImpressoes.toLocaleString("pt-BR")} impressões`),
      trend: cliquesCompare?.direction ?? "neutral",
    },
    {
      label: "CPC Médio",
      value: formatBRL2(cpcMedio),
      // CPC menor é melhor — inverte a leitura do ícone (queda de custo é "up")
      note: compareNote(cpcCompare, "Custo médio por clique"),
      trend: cpcCompare ? (cpcCompare.direction === "up" ? "down" : cpcCompare.direction === "down" ? "up" : "neutral") : "neutral",
    },
  ];

  const ICONS = [Wallet, TrendingUp, Target, Award, MousePointer, Percent];

  const highlightItems = [
    {
      key: "canal",
      label: "Canal Prioritário",
      value: topBudgetSummary ? channelName(topBudgetSummary.channelId) : "—",
      sub: topBudgetSummary ? `${formatBRL2(topBudgetSummary.investimento)} investidos` : "sem dados",
      icon: Zap,
    },
    {
      key: "roas",
      label: "Melhor ROAS",
      value: bestRoasSummary && (bestRoasSummary.roas ?? 0) > 0 ? `${bestRoasSummary.roas!.toFixed(2).replace(".", ",")}x` : "—",
      sub: bestRoasSummary ? channelName(bestRoasSummary.channelId) : "sem canal com rastreamento",
      icon: Award,
    },
    {
      key: "ctr",
      label: "Melhor CTR",
      value: bestCtrSummary ? `${(bestCtrSummary.ctr * 100).toFixed(2).replace(".", ",")}%` : "—",
      sub: bestCtrSummary ? channelName(bestCtrSummary.channelId) : "sem dados",
      icon: MousePointerClick,
    },
  ];

  const benchmarkRoas = 5;
  const benchmarkNote =
    bestRoasSummary && (bestRoasSummary.roas ?? 0) > 0
      ? `Benchmark de mercado (peças automotivas): ${benchmarkRoas}x — ${channelName(bestRoasSummary.channelId)} está em ${bestRoasSummary.roas!.toFixed(2).replace(".", ",")}x (${(bestRoasSummary.roas! / benchmarkRoas).toFixed(1).replace(".", ",")}x o benchmark). Considera só canais com receita rastreada.`
      : `Benchmark de mercado (peças automotivas): ${benchmarkRoas}x de ROAS.`;

  return (
    <div className="flex flex-col gap-4">
      <AlertsStrip items={insights.slice(0, 4)} />

      <Highlights items={highlightItems} />

      {loading && summaries.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-[12.5px] text-text-3">
          Carregando métricas reais dos canais selecionados…
        </div>
      ) : (
        <KpiGrid items={overviewKpis.map((kpi, i) => ({ ...kpi, icon: ICONS[i] }))} />
      )}

      <Section
        title="Receita Atribuída ao Longo do Tempo"
        subtitle={`${periodLabel} vs período anterior · só MELI/Amazon (únicos com receita rastreada)`}
      >
        {dailyTrend.loading ? (
          <p className="py-10 text-center text-[12.5px] text-text-3">Carregando série diária…</p>
        ) : dailyTrend.channelsWithData.length === 0 ? (
          <p className="py-10 text-center text-[12.5px] text-text-3">
            Nenhum canal com receita rastreada disponível para o período/seleção atual.
          </p>
        ) : dailyTrend.points.length < 2 ? (
          <p className="py-10 text-center text-[12.5px] text-text-3">
            Selecione um período com pelo menos 2 dias pra ver a tendência.
          </p>
        ) : (
          <>
            <AreaLineChart data={dailyTrend.points} />
            {dailyTrend.channelsFailed.length > 0 && (
              <p className="mt-3 text-[11px] text-text-3">
                Não foi possível carregar a série diária de{" "}
                {dailyTrend.channelsFailed.map((c) => CHANNELS.find((ch) => ch.id === c)!.name).join(", ")} agora —
                o gráfico mostra os canais que responderam.
              </p>
            )}
          </>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Distribuição do Budget" subtitle={`% do investimento total · ${periodLabel}`}>
          {summaries.length === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-text-3">Aguardando dados…</p>
          ) : (
            <StackedBar
              segments={summaries
                .filter((s) => s.investimento > 0)
                .map((s) => {
                  const channel = CHANNELS.find((c) => c.id === s.channelId)!;
                  const pct = totalInvestimento > 0 ? (s.investimento / totalInvestimento) * 100 : 0;
                  return {
                    key: s.channelId,
                    label: channel.name,
                    value: s.investimento,
                    display: `${pct.toFixed(1).replace(".", ",")}%`,
                    colorClass: channel.color,
                    hex: channel.hex,
                  };
                })}
              footer={`Investimento total distribuído entre ${summaries.length} canais ativos`}
            />
          )}
        </Section>

        <Section title="ROAS por Canal" subtitle="Retorno sobre investimento, do maior para o menor · só canais com receita rastreada">
          {summaries.length === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-text-3">Aguardando dados…</p>
          ) : revenueSummaries.length === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-text-3">
              Nenhum canal selecionado tem receita rastreada no momento.
            </p>
          ) : (
            <>
              <ProgressList
                rows={[...revenueSummaries]
                  .sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0))
                  .map((s) => {
                    const channel = CHANNELS.find((c) => c.id === s.channelId)!;
                    return {
                      key: s.channelId,
                      label: channel.name,
                      display: (s.roas ?? 0) > 0 ? `${s.roas!.toFixed(2).replace(".", ",")}x` : "—",
                      percent: ((s.roas ?? 0) / 10) * 100,
                      colorClass: channel.color,
                    };
                  })}
              />
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-accent/25 bg-accent/10 px-3.5 py-3">
                <Award className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} aria-hidden="true" />
                <p className="text-[12.5px] leading-snug text-text-1">{benchmarkNote}</p>
              </div>
            </>
          )}
          {noRevenueSummaries.length > 0 && (
            <p className="mt-3 text-[11px] leading-snug text-text-3">
              {noRevenueSummaries.map((s) => channelName(s.channelId)).join(" e ")} não{" "}
              {noRevenueSummaries.length > 1 ? "aparecem" : "aparece"} aqui: sem evento de compra com valor
              configurado nesta conta, então não dá pra calcular ROAS real (não é o mesmo que ROAS zero).
            </p>
          )}
        </Section>
      </div>

      <Section title="Top Produtos" subtitle="Ilustrativo (mock) · integração por SKU ainda não conectada">
        <ProductsTable products={topProdutos} />
      </Section>
    </div>
  );
}
