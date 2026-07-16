"use client";

import { useState } from "react";
import { Eye, Globe, Heart, Sparkles, UserMinus, UserPlus, Users } from "lucide-react";
import { InstagramIcon } from "../icons/InstagramIcon";
import {
  audienceMix,
  audienceMixCallout,
  editorialContext,
  instagramEvent,
  instagramKpis,
  topPosts,
  type InstagramPeriod,
} from "@/data/mock-dashboard";
import { KpiGrid } from "../KpiCard";
import { Section } from "../Section";
import { ProgressList } from "../ProgressList";
import { PostsTable } from "../PostsTable";
import { Badge } from "../Badge";

const PERIODS: { id: InstagramPeriod; label: string }[] = [
  { id: "30d", label: "Últimos 30 dias" },
  { id: "2026", label: "Acumulado 2026" },
];

const ICONS = [Eye, Globe, Heart, UserPlus, UserMinus, Users];

export function InstagramTab() {
  const [period, setPeriod] = useState<InstagramPeriod>("30d");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent">
            <InstagramIcon className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-[14px] font-semibold text-text-1">Instagram Orgânico</h2>
            <p className="text-[11.5px] text-text-3">
              {period === "30d" ? "Últimos 30 dias (12 abr – 9 mai 2026)" : "Acumulado — Jan a Dez 2026"}
            </p>
          </div>
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-background p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors duration-150 ${
                period === p.id ? "bg-accent text-accent-foreground" : "text-text-2 hover:text-text-1"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <KpiGrid items={instagramKpis[period].map((kpi, i) => ({ ...kpi, icon: ICONS[i] }))} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Mix de Audiência" subtitle="Seguidores vs não seguidores">
          <ProgressList
            rows={audienceMix.map((m) => ({
              key: m.label,
              label: m.label,
              display: m.display,
              percent: m.value,
              colorClass: "bg-accent",
            }))}
          />
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-accent/25 bg-accent/10 px-3.5 py-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} aria-hidden="true" />
            <p className="text-[12.5px] leading-snug text-text-1">{audienceMixCallout}</p>
          </div>
        </Section>

        <Section title="Contexto Editorial 2026">
          <ul className="flex flex-col gap-3.5">
            {editorialContext.map((item) => (
              <li key={item.title} className="flex gap-3 border-b border-dashed border-border pb-3.5 last:border-0 last:pb-0">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-text-1">{item.title}</p>
                    <Badge tone="accent">{item.badge}</Badge>
                  </div>
                  <p className="text-[12.5px] leading-snug text-text-2">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Top Posts" subtitle="Melhores publicações por visualização no período">
        <PostsTable posts={topPosts} />
      </Section>

      <div className="rounded-lg border border-accent/30 bg-accent/[0.06] p-4 sm:p-5">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" strokeWidth={2} aria-hidden="true" />
          <h2 className="text-[13px] font-semibold text-accent">Evento: {instagramEvent.title}</h2>
        </div>
        <p className="text-[13px] leading-relaxed text-text-1">{instagramEvent.body}</p>
      </div>
    </div>
  );
}
