"use client";

/* eslint-disable @next/next/no-img-element -- imagens vêm de domínios dinâmicos do CDN da Meta (scontent-*.fbcdn.net), não dá pra pré-configurar em next.config */

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Section } from "./Section";
import type { MetaCreative } from "@/lib/platforms/meta-ads";

interface CreativesState {
  status: "loading" | "success" | "error";
  creatives: MetaCreative[];
  error: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
};

export function MetaCreativesGrid() {
  const [state, setState] = useState<CreativesState>({ status: "loading", creatives: [], error: null });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/meta-ads/creatives")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`);
        return json as { creatives: MetaCreative[] };
      })
      .then((json) => {
        if (cancelled) return;
        setState({ status: "success", creatives: json.creatives, error: null });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({ status: "error", creatives: [], error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Section title="Criativos — Meta Ads" subtitle="Imagens dos anúncios ativos/pausados mais recentes">
      {state.status === "loading" && (
        <div className="flex items-center justify-center gap-2.5 py-8 text-[12.5px] text-text-3">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
          Buscando criativos…
        </div>
      )}

      {state.status === "error" && (
        <div className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-3 text-[12.5px] leading-snug text-text-1">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
          <span>Falha ao buscar criativos do Meta Ads: {state.error}</span>
        </div>
      )}

      {state.status === "success" && state.creatives.length === 0 && (
        <p className="py-6 text-center text-[12.5px] text-text-3">Nenhum criativo com imagem disponível agora.</p>
      )}

      {state.status === "success" && state.creatives.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {state.creatives.map((c) => (
              <div key={c.adId} className="overflow-hidden rounded-lg border border-border bg-background">
                <div className="aspect-square w-full overflow-hidden bg-surface-2">
                  <img src={c.imageUrl!} alt={c.adName} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-2">
                  <p className="truncate text-[11.5px] font-medium text-text-1" title={c.adName}>
                    {c.adName}
                  </p>
                  {c.status && <p className="text-[10px] text-text-3">{STATUS_LABEL[c.status] ?? c.status}</p>}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-snug text-text-3">
            Criativos com &ldquo;Advantage+&rdquo; podem aparecer com resolução reduzida — comportamento da própria
            Meta, não é um problema de carregamento.
          </p>
        </>
      )}
    </Section>
  );
}
