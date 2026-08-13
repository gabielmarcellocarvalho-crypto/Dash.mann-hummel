// Dados mockados do dashboard Mann Hummel — Marketing Digital
// Todos os valores aqui são fictícios, coerentes com o segmento de filtros
// automotivos/industriais. Cada bloco indica a fonte real que vai substituí-lo.

export type ChannelId = "meli" | "google" | "amazon" | "meta";

export interface ChannelMeta {
  id: ChannelId;
  name: string;
  tag: string;
  color: string; // classe tailwind (bg-*) usada em dots/barras
  hex: string; // mesma cor em hex, para uso em SVG (donut/gráficos)
}

export const CHANNELS: ChannelMeta[] = [
  { id: "meli", name: "Mercado Livre", tag: "marketplace", color: "bg-emerald-400", hex: "#34d399" },
  { id: "google", name: "Google Ads", tag: "search / display", color: "bg-sky-400", hex: "#38bdf8" },
  { id: "amazon", name: "Amazon Ads", tag: "marketplace", color: "bg-orange-400", hex: "#fb923c" },
  { id: "meta", name: "Meta Ads", tag: "social", color: "bg-violet-400", hex: "#a78bfa" },
];

export interface Kpi {
  label: string;
  value: string;
  note: string;
  trend?: "up" | "down" | "neutral";
}

// TODO: conectar Meta Ads Marketing API (META_ACCESS_TOKEN, META_AD_ACCOUNT_ID) +
// Google Ads API (GOOGLE_ADS_*) + Amazon Advertising API (AMAZON_ADS_*) +
// Mercado Livre Ads API (MELI_*) — agregação cross-canal
export const overviewKpis: Kpi[] = [
  { label: "Investimento Total", value: "R$ 92.480", note: "4 canais ativos", trend: "neutral" },
  { label: "Receita Atribuída", value: "R$ 512.360", note: "Meli + Amazon lideram", trend: "up" },
  { label: "Melhor ROAS", value: "9,84x", note: "Mercado Livre · acima do benchmark", trend: "up" },
  { label: "Pessoas Alcançadas", value: "5,12M", note: "via tráfego pago", trend: "up" },
  { label: "Total de Conversões", value: "3.284", note: "compras + cliques loja", trend: "up" },
  { label: "ACOS Mais Eficiente", value: "6,7%", note: "meta: abaixo de 12%", trend: "up" },
];

export interface InvestRevenue {
  channelId: ChannelId;
  investimento: number;
  receita: number;
}

export const investVsRevenue: InvestRevenue[] = [
  { channelId: "meli", investimento: 28400, receita: 279500 },
  { channelId: "google", investimento: 24100, receita: 96800 },
  { channelId: "amazon", investimento: 21300, receita: 88900 },
  { channelId: "meta", investimento: 18680, receita: 47160 },
];

// TODO: conectar Meta Ads / Google Ads / Amazon Advertising / Mercado Livre Ads APIs —
// série diária consolidada de receita atribuída (últimos 30 dias) + período anterior
export interface TrendPoint {
  date: string;
  atual: number;
  anterior: number;
}

export const receitaTrend: TrendPoint[] = [
  { date: "10/04", atual: 13200, anterior: 11400 },
  { date: "11/04", atual: 15800, anterior: 12100 },
  { date: "12/04", atual: 14100, anterior: 13600 },
  { date: "13/04", atual: 11600, anterior: 12800 },
  { date: "14/04", atual: 17400, anterior: 13100 },
  { date: "15/04", atual: 21200, anterior: 14400 },
  { date: "16/04", atual: 18900, anterior: 15200 },
  { date: "17/04", atual: 14700, anterior: 13900 },
  { date: "18/04", atual: 12300, anterior: 12600 },
  { date: "19/04", atual: 16100, anterior: 13200 },
  { date: "20/04", atual: 19800, anterior: 14100 },
  { date: "21/04", atual: 24600, anterior: 15800 },
  { date: "22/04", atual: 20300, anterior: 16200 },
  { date: "23/04", atual: 16800, anterior: 14700 },
  { date: "24/04", atual: 13900, anterior: 13400 },
  { date: "25/04", atual: 17200, anterior: 14000 },
  { date: "26/04", atual: 21600, anterior: 15600 },
  { date: "27/04", atual: 18400, anterior: 16100 },
  { date: "28/04", atual: 15100, anterior: 14300 },
  { date: "29/04", atual: 12800, anterior: 13000 },
  { date: "30/04", atual: 16400, anterior: 13700 },
  { date: "01/05", atual: 19700, anterior: 14900 },
  { date: "02/05", atual: 23100, anterior: 16400 },
  { date: "03/05", atual: 19200, anterior: 15800 },
  { date: "04/05", atual: 15600, anterior: 14200 },
  { date: "05/05", atual: 13400, anterior: 13100 },
  { date: "06/05", atual: 17900, anterior: 14600 },
  { date: "07/05", atual: 22400, anterior: 16000 },
  { date: "08/05", atual: 20100, anterior: 15400 },
  { date: "09/05", atual: 16700, anterior: 14100 },
];

export interface ChannelRatio {
  channelId: ChannelId;
  value: number; // roas ou % — valor bruto
  display: string;
}

export const roasPorCanal: ChannelRatio[] = [
  { channelId: "meli", value: 9.84, display: "9,84x" },
  { channelId: "amazon", value: 4.17, display: "4,17x" },
  { channelId: "google", value: 4.02, display: "4,02x" },
  { channelId: "meta", value: 2.53, display: "2,53x" },
];

export const distribuicaoBudget: ChannelRatio[] = [
  { channelId: "meli", value: 30.7, display: "30,7%" },
  { channelId: "google", value: 26.1, display: "26,1%" },
  { channelId: "amazon", value: 23.0, display: "23,0%" },
  { channelId: "meta", value: 20.2, display: "20,2%" },
];

export const benchmarkNote =
  "Benchmark de mercado (peças automotivas): 5x — Mercado Livre performa quase 2x acima, com ACOS de 6,7%.";

// TODO: conectar Meta Ads Marketing API / Google Ads API / Amazon Advertising API /
// Mercado Livre Ads API — métricas detalhadas por canal
export interface ChannelDetail {
  channelId: ChannelId;
  investimento: string;
  cliquesCompras: string;
  ctr: string;
  cpcMedio: string;
  roas: string;
  nota?: string;
}

export const porCanalDetalhe: ChannelDetail[] = [
  {
    channelId: "meli",
    investimento: "R$ 28.400",
    cliquesCompras: "1.845",
    ctr: "0,14%",
    cpcMedio: "R$ 0,12",
    roas: "9,84x",
    nota: "Receita atribuída: R$ 279.500 — R$ 68.910 direto + R$ 210.590 indireto · R$ 9,84 de retorno por cada R$ 1 investido",
  },
  {
    channelId: "google",
    investimento: "R$ 24.100",
    cliquesCompras: "812",
    ctr: "3,92%",
    cpcMedio: "R$ 0,68",
    roas: "4,02x",
  },
  {
    channelId: "amazon",
    investimento: "R$ 21.300",
    cliquesCompras: "940",
    ctr: "0,18%",
    cpcMedio: "R$ 0,85",
    roas: "4,17x",
    nota: "Receita atribuída: R$ 88.900 · R$ 4,17 de retorno por cada R$ 1 investido",
  },
  {
    channelId: "meta",
    investimento: "R$ 18.680",
    cliquesCompras: "15.240",
    ctr: "2,11%",
    cpcMedio: "R$ 0,19",
    roas: "2,53x",
  },
];

// TODO: fonte de insights — cruzamento das APIs acima via regra de negócio interna
// (sem endpoint dedicado; calculado a partir dos dados agregados)
export type InsightSeverity = "imediato" | "urgente" | "esta-semana" | "90-dias";
export type InsightDirection = "up" | "alert" | "arrow";

export interface InsightItem {
  id: string;
  direction: InsightDirection;
  severity: InsightSeverity;
  title: string;
  body: string;
}

export const insightCounts = { oportunidades: 2, alertas: 2, observacoes: 1 };

export const insights: InsightItem[] = [
  {
    id: "ins-1",
    direction: "up",
    severity: "imediato",
    title: "Mercado Livre com ROAS 2x acima do benchmark",
    body: "Canal com maior retorno está com budget subutilizado (30,7% do total). Redistribuir verba de Meta Ads para Mercado Livre pode elevar receita atribuída sem aumentar investimento total.",
  },
  {
    id: "ins-2",
    direction: "up",
    severity: "imediato",
    title: "Google Search com CPC baixo em campanhas de marca",
    body: "CPC médio de R$ 0,68 está abaixo do histórico. Espaço para escalar orçamento em até 20% mantendo eficiência.",
  },
  {
    id: "ins-3",
    direction: "alert",
    severity: "urgente",
    title: "Meta Ads com CTR em queda de 18% no último trimestre",
    body: "Fadiga de criativos identificada nas campanhas de prospecção. Recomenda-se renovação de criativos nas próximas 2 semanas.",
  },
  {
    id: "ins-4",
    direction: "alert",
    severity: "esta-semana",
    title: "Amazon Ads com ACOS acima da meta em SKUs de filtro de ar",
    body: "ACOS 22% vs meta de 15% na linha de filtros de ar. Revisar lances e mix de produtos anunciados.",
  },
  {
    id: "ins-5",
    direction: "arrow",
    severity: "90-dias",
    title: "Crescimento orgânico do Instagram pode estar canibalizando cliques pagos de marca",
    body: "Aumento de 71% em novos seguidores coincide com queda em cliques de campanhas de marca no Google. Monitorar nos próximos 90 dias antes de realocar budget.",
  },
];

// TODO: conectar Meta Ads / Google Ads / Amazon Advertising / Mercado Livre Ads APIs
// para realizado mensal; metas anuais vêm do planejamento comercial interno
export interface GoalMonth {
  month: string;
  sazonalidade: string;
  meta: number;
  realizado: number | null;
}

export interface ChannelGoal {
  channelId: ChannelId;
  metaAnual: number;
  realizado: string;
  percentualMeta: string;
  gapRestante: string;
  months: GoalMonth[];
}

export const metas2026: ChannelGoal[] = [
  {
    channelId: "meli",
    metaAnual: 1240000,
    realizado: "R$ 279.500",
    percentualMeta: "22,5%",
    gapRestante: "R$ 960.500",
    months: [
      { month: "Jan", sazonalidade: "5,8%", meta: 71920, realizado: 58400 },
      { month: "Fev", sazonalidade: "6,4%", meta: 79360, realizado: 61200 },
      { month: "Mar", sazonalidade: "9,1%", meta: 112840, realizado: 78900 },
      { month: "Abr", sazonalidade: "10,3%", meta: 127720, realizado: 81000 },
      { month: "Mai", sazonalidade: "8,2%", meta: 101680, realizado: null },
      { month: "Jun", sazonalidade: "7,6%", meta: 94240, realizado: null },
      { month: "Jul", sazonalidade: "7,9%", meta: 97960, realizado: null },
      { month: "Ago", sazonalidade: "8,8%", meta: 109120, realizado: null },
      { month: "Set", sazonalidade: "10,9%", meta: 135160, realizado: null },
      { month: "Out", sazonalidade: "10,6%", meta: 131440, realizado: null },
      { month: "Nov", sazonalidade: "7,2%", meta: 89280, realizado: null },
      { month: "Dez", sazonalidade: "7,2%", meta: 89280, realizado: null },
    ],
  },
  {
    channelId: "amazon",
    metaAnual: 420000,
    realizado: "R$ 88.900",
    percentualMeta: "21,2%",
    gapRestante: "R$ 331.100",
    months: [
      { month: "Jan", sazonalidade: "6,1%", meta: 25620, realizado: 19800 },
      { month: "Fev", sazonalidade: "6,7%", meta: 28140, realizado: 20100 },
      { month: "Mar", sazonalidade: "9,4%", meta: 39480, realizado: 24500 },
      { month: "Abr", sazonalidade: "10,0%", meta: 42000, realizado: 24500 },
      { month: "Mai", sazonalidade: "8,0%", meta: 33600, realizado: null },
      { month: "Jun", sazonalidade: "7,4%", meta: 31080, realizado: null },
      { month: "Jul", sazonalidade: "7,8%", meta: 32760, realizado: null },
      { month: "Ago", sazonalidade: "8,6%", meta: 36120, realizado: null },
      { month: "Set", sazonalidade: "10,5%", meta: 44100, realizado: null },
      { month: "Out", sazonalidade: "10,2%", meta: 42840, realizado: null },
      { month: "Nov", sazonalidade: "7,3%", meta: 30660, realizado: null },
      { month: "Dez", sazonalidade: "7,0%", meta: 29400, realizado: null },
    ],
  },
  {
    channelId: "google",
    metaAnual: 340000,
    realizado: "R$ 96.800",
    percentualMeta: "28,5%",
    gapRestante: "R$ 243.200",
    months: [
      { month: "Jan", sazonalidade: "6,0%", meta: 20400, realizado: 19600 },
      { month: "Fev", sazonalidade: "6,6%", meta: 22440, realizado: 21400 },
      { month: "Mar", sazonalidade: "9,0%", meta: 30600, realizado: 27100 },
      { month: "Abr", sazonalidade: "9,8%", meta: 33320, realizado: 28700 },
      { month: "Mai", sazonalidade: "8,1%", meta: 27540, realizado: null },
      { month: "Jun", sazonalidade: "7,5%", meta: 25500, realizado: null },
      { month: "Jul", sazonalidade: "7,7%", meta: 26180, realizado: null },
      { month: "Ago", sazonalidade: "8,5%", meta: 28900, realizado: null },
      { month: "Set", sazonalidade: "10,3%", meta: 35020, realizado: null },
      { month: "Out", sazonalidade: "10,0%", meta: 34000, realizado: null },
      { month: "Nov", sazonalidade: "7,1%", meta: 24140, realizado: null },
      { month: "Dez", sazonalidade: "7,4%", meta: 25160, realizado: null },
    ],
  },
  {
    channelId: "meta",
    metaAnual: 260000,
    realizado: "R$ 47.160",
    percentualMeta: "18,1%",
    gapRestante: "R$ 212.840",
    months: [
      { month: "Jan", sazonalidade: "6,2%", meta: 16120, realizado: 10600 },
      { month: "Fev", sazonalidade: "6,8%", meta: 17680, realizado: 11200 },
      { month: "Mar", sazonalidade: "9,2%", meta: 23920, realizado: 12400 },
      { month: "Abr", sazonalidade: "9,9%", meta: 25740, realizado: 12960 },
      { month: "Mai", sazonalidade: "8,0%", meta: 20800, realizado: null },
      { month: "Jun", sazonalidade: "7,4%", meta: 19240, realizado: null },
      { month: "Jul", sazonalidade: "7,8%", meta: 20280, realizado: null },
      { month: "Ago", sazonalidade: "8,6%", meta: 22360, realizado: null },
      { month: "Set", sazonalidade: "10,4%", meta: 27040, realizado: null },
      { month: "Out", sazonalidade: "10,1%", meta: 26260, realizado: null },
      { month: "Nov", sazonalidade: "7,2%", meta: 18720, realizado: null },
      { month: "Dez", sazonalidade: "7,4%", meta: 19240, realizado: null },
    ],
  },
];

