"use client";

import { Loader2, AlertTriangle, Check } from "lucide-react";
import { CHANNELS } from "@/data/mock-dashboard";
import { useDashboardFilters } from "./DashboardDataContext";

export function FiltersBar() {
  const { channels, toggleChannel, data } = useDashboardFilters();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-3">Canais:</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {CHANNELS.map((channel) => {
          const active = channels.includes(channel.id);
          const status = data[channel.id].status;

          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => toggleChannel(channel.id)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors duration-150 ${
                active
                  ? "border-border-strong bg-background text-text-1"
                  : "border-border/60 text-text-3 opacity-50 hover:opacity-75"
              }`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${channel.color}`} aria-hidden="true" />
              {channel.name}
              {active && status === "loading" && (
                <Loader2 className="h-3 w-3 shrink-0 animate-spin text-text-3" aria-hidden="true" />
              )}
              {active && status === "error" && (
                <AlertTriangle className="h-3 w-3 shrink-0 text-danger" aria-hidden="true" />
              )}
              {active && status === "success" && (
                <Check className="h-3 w-3 shrink-0 text-success" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
