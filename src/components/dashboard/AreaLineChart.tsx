"use client";

import { useId, useRef, useState } from "react";
import type { TrendPoint } from "@/data/mock-dashboard";
import { formatCompactBRL } from "@/lib/format";

const WIDTH = 720;
const HEIGHT = 230;
const PAD_L = 44;
const PAD_R = 8;
const PAD_T = 14;
const PAD_B = 24;

type Point = { x: number; y: number };

function buildPoints(values: number[], max: number): Point[] {
  const innerW = WIDTH - PAD_L - PAD_R;
  const innerH = HEIGHT - PAD_T - PAD_B;
  const step = innerW / (values.length - 1);
  return values.map((v, i) => ({
    x: PAD_L + i * step,
    y: PAD_T + innerH - (v / max) * innerH,
  }));
}

/** Catmull-Rom → Bézier, pra curva suave sem depender de libs de gráfico. */
function smoothPath(points: Point[]) {
  if (points.length < 3) {
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  }
  let d = `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

export function AreaLineChart({ data }: { data: TrendPoint[] }) {
  const gradientId = useId();
  const glowId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [showAnterior, setShowAnterior] = useState(true);

  const max = Math.max(...data.map((d) => Math.max(d.atual, d.anterior))) * 1.1;
  const innerW = WIDTH - PAD_L - PAD_R;
  const step = innerW / (data.length - 1);

  const atualPoints = buildPoints(data.map((d) => d.atual), max);
  const anteriorPoints = buildPoints(data.map((d) => d.anterior), max);
  const atualPath = smoothPath(atualPoints);
  const areaPath = `${atualPath} L${atualPoints[atualPoints.length - 1].x.toFixed(2)},${HEIGHT - PAD_B} L${atualPoints[0].x.toFixed(2)},${HEIGHT - PAD_B} Z`;

  const gridLines = 4;
  const last = data.length - 1;

  function handleMove(e: React.MouseEvent<SVGRectElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const xInViewBox = ratio * WIDTH;
    const idx = Math.round((xInViewBox - PAD_L) / step);
    setHover(Math.min(last, Math.max(0, idx)));
  }

  const activePoint = hover != null ? atualPoints[hover] : null;
  const tooltipLeft = activePoint ? (activePoint.x / WIDTH) * 100 : 0;
  const tooltipAbove = activePoint ? activePoint.y / HEIGHT < 0.42 : false;

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-accent">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
          Receita
        </span>
        <button
          type="button"
          onClick={() => setShowAnterior((v) => !v)}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors duration-150 ${
            showAnterior
              ? "border-border-strong text-text-2 hover:text-text-1"
              : "border-border text-text-3/50 hover:text-text-3"
          }`}
          aria-pressed={showAnterior}
        >
          <span
            className="h-2.5 w-2.5 rounded-full border border-dashed border-current"
            aria-hidden="true"
          />
          Período anterior
        </button>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full overflow-visible"
          role="img"
          aria-label="Receita atribuída ao longo do tempo, comparada ao período anterior"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.4" />
              <stop offset="65%" stopColor="var(--color-accent)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
            <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="var(--color-accent)" floodOpacity="0.55" />
            </filter>
          </defs>

          {Array.from({ length: gridLines + 1 }).map((_, i) => {
            const y = PAD_T + ((HEIGHT - PAD_T - PAD_B) / gridLines) * i;
            const value = max - (max / gridLines) * i;
            return (
              <g key={i}>
                <line
                  x1={PAD_L}
                  x2={WIDTH - PAD_R}
                  y1={y}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                />
                <text x={0} y={y + 3} fontSize="9.5" fill="var(--color-text-3)">
                  {formatCompactBRL(Math.round(value))}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill={`url(#${gradientId})`} className="animate-[fadeIn_.6s_ease]" />

          {showAnterior && (
            <path
              d={smoothPath(anteriorPoints)}
              fill="none"
              stroke="var(--color-text-3)"
              strokeWidth={1.5}
              strokeDasharray="3 4"
              strokeLinecap="round"
              className="animate-[fadeIn_.6s_ease]"
            />
          )}

          <path
            d={atualPath}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
            className="animate-[fadeIn_.6s_ease]"
          />

          {/* pulso "ao vivo" no último ponto */}
          <circle cx={atualPoints[last].x} cy={atualPoints[last].y} r={3} fill="var(--color-accent)" />
          <circle cx={atualPoints[last].x} cy={atualPoints[last].y} r={3} fill="var(--color-accent)">
            <animate attributeName="r" values="3;9;3" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="2.2s" repeatCount="indefinite" />
          </circle>

          {hover != null && (
            <g>
              <line
                x1={atualPoints[hover].x}
                x2={atualPoints[hover].x}
                y1={PAD_T}
                y2={HEIGHT - PAD_B}
                stroke="var(--color-border-strong)"
                strokeWidth={1}
              />
              <circle cx={atualPoints[hover].x} cy={atualPoints[hover].y} r={4} fill="var(--color-accent)" stroke="var(--color-background)" strokeWidth={2} />
              {showAnterior && (
                <circle cx={anteriorPoints[hover].x} cy={anteriorPoints[hover].y} r={3} fill="var(--color-text-3)" stroke="var(--color-background)" strokeWidth={2} />
              )}
            </g>
          )}

          {data.map((d, i) =>
            i % 5 === 0 ? (
              <text key={d.date} x={PAD_L + i * step} y={HEIGHT - 4} fontSize="9.5" textAnchor="middle" fill="var(--color-text-3)">
                {d.date}
              </text>
            ) : null,
          )}

          <rect
            x={PAD_L}
            y={0}
            width={innerW}
            height={HEIGHT - PAD_B}
            fill="transparent"
            onMouseMove={handleMove}
            onMouseLeave={() => setHover(null)}
          />
        </svg>

        {hover != null && (
          <div
            className={`pointer-events-none absolute z-10 w-max -translate-x-1/2 rounded-lg border border-border-strong bg-surface-2 px-3 py-2 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.6)] ${
              tooltipAbove ? "top-2" : "-top-2 -translate-y-full"
            }`}
            style={{ left: `${tooltipLeft}%` }}
          >
            <p className="mb-1 text-[11px] font-semibold text-text-1">{data[hover].date}</p>
            <p className="flex items-center gap-1.5 text-[12px] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              {formatCompactBRL(data[hover].atual)}
            </p>
            {showAnterior && (
              <p className="flex items-center gap-1.5 text-[11.5px] text-text-3">
                <span className="h-1.5 w-1.5 rounded-full bg-text-3" aria-hidden="true" />
                {formatCompactBRL(data[hover].anterior)}
                <span
                  className={
                    data[hover].atual >= data[hover].anterior ? "text-success-foreground" : "text-danger-foreground"
                  }
                >
                  ({data[hover].atual >= data[hover].anterior ? "+" : ""}
                  {Math.round(((data[hover].atual - data[hover].anterior) / data[hover].anterior) * 100)}%)
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
