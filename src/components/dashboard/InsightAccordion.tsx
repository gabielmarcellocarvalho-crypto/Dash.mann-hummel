"use client";

import { useState } from "react";
import { ArrowRight, AlertTriangle, Check, ChevronDown, TrendingUp } from "lucide-react";
import type { InsightItem, InsightSeverity } from "@/data/mock-dashboard";
import { Badge, type BadgeTone } from "./Badge";

const SEVERITY_LABEL: Record<InsightSeverity, string> = {
  imediato: "Imediato",
  urgente: "Urgente",
  "esta-semana": "Esta Semana",
  "90-dias": "90 Dias",
};

const SEVERITY_TONE: Record<InsightSeverity, BadgeTone> = {
  imediato: "success",
  urgente: "danger",
  "esta-semana": "warning",
  "90-dias": "info",
};

const DIRECTION_ICON = { up: TrendingUp, alert: AlertTriangle, arrow: ArrowRight };
const DIRECTION_TONE: Record<InsightItem["direction"], string> = {
  up: "border-success/30 bg-success/10 text-success-foreground",
  alert: "border-danger/30 bg-danger/10 text-danger-foreground",
  arrow: "border-info/30 bg-info/10 text-info-foreground",
};

export function InsightAccordionItem({ item }: { item: InsightItem }) {
  const [open, setOpen] = useState(false);
  const [resolved, setResolved] = useState(false);
  const Icon = DIRECTION_ICON[item.direction];

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-surface transition-colors duration-200 ${
        open ? "border-accent/40" : "border-border hover:border-border-strong"
      } ${resolved ? "opacity-55" : ""}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-white/[0.03] sm:px-5"
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-transform duration-200 ${DIRECTION_TONE[item.direction]} ${open ? "scale-105" : ""}`}
          aria-hidden="true"
        >
          {resolved ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Icon className="h-4 w-4" strokeWidth={2.25} />}
        </span>
        <div className="min-w-0 flex-1">
          <Badge tone={SEVERITY_TONE[item.severity]} className="mb-1.5">
            {SEVERITY_LABEL[item.severity]}
          </Badge>
          <p className={`text-[13.5px] font-semibold text-text-1 ${resolved ? "line-through" : ""}`}>{item.title}</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border px-4 py-3.5 sm:px-5">
            <p className="max-w-2xl text-[13px] leading-relaxed text-text-2">{item.body}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setResolved((v) => !v);
              }}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11.5px] font-semibold transition-colors duration-150 ${
                resolved
                  ? "border-success/30 bg-success/10 text-success-foreground hover:bg-success/15"
                  : "border-border-strong text-text-2 hover:border-accent/50 hover:text-accent"
              }`}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
              {resolved ? "Resolvido" : "Marcar como resolvido"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
