"use client";

import { useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { TabNav, type TabDef } from "@/components/dashboard/TabNav";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { DashboardFiltersProvider } from "@/components/dashboard/DashboardDataContext";
import { OverviewTab } from "@/components/dashboard/tabs/OverviewTab";
import { ByChannelTab } from "@/components/dashboard/tabs/ByChannelTab";
import { InsightsTab } from "@/components/dashboard/tabs/InsightsTab";
import { YearOverYearTab } from "@/components/dashboard/tabs/YearOverYearTab";
import { GoalsTab } from "@/components/dashboard/tabs/GoalsTab";

// Instagram Orgânico fica fora do menu por enquanto: os dados dessa aba ainda
// são 100% mock (nenhuma integração com a Instagram Graph API foi feita) e o
// dashboard já está indo para produção com dados reais nas outras abas.
const TABS: TabDef[] = [
  { id: "overview", label: "Visão Geral" },
  { id: "by-channel", label: "Por Canal" },
  { id: "insights", label: "Insights & Ações" },
  { id: "yoy", label: "Ano vs Ano" },
  { id: "goals", label: "Metas 2026" },
];

export default function Home() {
  const [active, setActive] = useState<string>(TABS[0].id);

  return (
    <DashboardFiltersProvider>
      <div className="flex flex-1 flex-col bg-background">
        <Header />
        <TabNav tabs={TABS} active={active} onChange={setActive} />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
            {(active === "overview" || active === "by-channel" || active === "insights") && <FiltersBar />}
            {active === "overview" && <OverviewTab />}
            {active === "by-channel" && <ByChannelTab />}
            {active === "insights" && <InsightsTab />}
            {active === "yoy" && <YearOverYearTab />}
            {active === "goals" && <GoalsTab />}
          </div>
        </main>
      </div>
    </DashboardFiltersProvider>
  );
}
