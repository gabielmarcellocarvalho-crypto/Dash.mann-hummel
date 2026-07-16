"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Calendar, ChevronDown, RefreshCw } from "lucide-react";
import { useDashboardFilters } from "./DashboardDataContext";
import { todayStr } from "@/lib/platforms/period";
import { PERIOD_OPTIONS } from "@/lib/platforms/types";

function formatTime(timestamp: number): string {
  const now = new Date(timestamp);
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function Header() {
  const { period, setPeriod, customRange, setCustomRange, range, periodLabel, refresh, isRefreshing, lastUpdatedAt } =
    useDashboardFilters();
  const [menuOpen, setMenuOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(range.dateFrom);
  const [customTo, setCustomTo] = useState(range.dateTo);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function openMenu() {
    setCustomFrom(range.dateFrom);
    setCustomTo(range.dateTo);
    setMenuOpen((v) => !v);
  }

  function applyCustomRange() {
    if (!customFrom || !customTo || customFrom > customTo) return;
    setCustomRange({ dateFrom: customFrom, dateTo: customTo });
    setMenuOpen(false);
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Image
          src="/mann-hummel-logo.webp"
          alt="Mann Hummel"
          width={1200}
          height={900}
          priority
          className="h-11 w-auto shrink-0 object-contain sm:h-14"
        />
        <div className="border-l border-border pl-3">
          <p className="text-[13px] font-semibold leading-tight text-text-1"></p>
          <p className="text-[13px] text-text-3">Relatório de Performance</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden items-center gap-1.5 text-[11.5px] text-text-3 sm:flex">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isRefreshing ? "bg-warning" : "bg-success"}`}
            aria-hidden="true"
          />
          {isRefreshing ? "Atualizando…" : `Atualizado ${lastUpdatedAt ? formatTime(lastUpdatedAt) : "—"}`}
        </span>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={openMenu}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[12.5px] font-medium text-text-2 hover:border-border-strong"
          >
            <Calendar className="h-3.5 w-3.5 text-text-3" strokeWidth={2} aria-hidden="true" />
            {customRange ? periodLabel : `Últimos ${periodLabel}`}
            <ChevronDown className="h-3 w-3 text-text-3" strokeWidth={2} aria-hidden="true" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-10 w-64 overflow-hidden rounded-lg border border-border bg-surface-2 py-1 shadow-lg">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setPeriod(opt.id);
                    setMenuOpen(false);
                  }}
                  className={`block w-full cursor-pointer px-3 py-2 text-left text-[12.5px] transition-colors duration-100 hover:bg-white/5 ${
                    opt.id === period && !customRange ? "font-semibold text-accent" : "text-text-2"
                  }`}
                >
                  Últimos {opt.label}
                </button>
              ))}

              <div className="border-t border-border px-3 py-2.5">
                <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-text-3">
                  Período personalizado
                </p>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo || todayStr()}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-1.5 py-1 text-[11.5px] text-text-1"
                  />
                  <span className="text-text-3" aria-hidden="true">
                    –
                  </span>
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom}
                    max={todayStr()}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-1.5 py-1 text-[11.5px] text-text-1"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyCustomRange}
                  disabled={!customFrom || !customTo || customFrom > customTo}
                  className="mt-2 w-full cursor-pointer rounded-md bg-accent px-2 py-1.5 text-[11.5px] font-semibold text-accent-foreground transition-opacity duration-150 hover:opacity-90 disabled:cursor-default disabled:opacity-50"
                >
                  Aplicar período
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={isRefreshing}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[12.5px] font-semibold text-accent-foreground transition-opacity duration-150 hover:opacity-90 disabled:cursor-default disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} strokeWidth={2.25} aria-hidden="true" />
          {isRefreshing ? "Atualizando…" : "Atualizar"}
        </button>
      </div>
    </header>
  );
}
