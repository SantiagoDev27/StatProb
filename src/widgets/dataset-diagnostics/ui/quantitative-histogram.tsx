"use client";

import { useMemo, useState } from "react";
import {
  buildHistogramBins,
  HISTOGRAM_INTERVAL_PRESETS,
  type HistogramIntervalPreset,
  type QuantitativeParameter,
  type QuantitativeStats,
} from "@/entities/dataset";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { DownloadIcon, InfoIcon } from "@/shared/ui/icons";

type QuantitativeHistogramProps = {
  parameter: QuantitativeParameter;
  stats: QuantitativeStats;
};

const SVG_W = 560;
const SVG_H = 260;
const PAD_L = 18;
const PAD_R = 18;
const PAD_T = 22;
const PAD_B = 34;
const PLOT_W = SVG_W - PAD_L - PAD_R;
const PLOT_H = SVG_H - PAD_T - PAD_B;

function normalPdf(x: number, mean: number, stdDev: number): number {
  if (stdDev <= 0) return 0;
  const z = (x - mean) / stdDev;
  return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
}

export function QuantitativeHistogram({
  parameter,
  stats,
}: QuantitativeHistogramProps) {
  const [intervalCount, setIntervalCount] = useState<HistogramIntervalPreset>(18);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const bins = useMemo(
    () =>
      buildHistogramBins(parameter.values, stats.min, stats.max, intervalCount),
    [parameter.values, stats.min, stats.max, intervalCount],
  );

  const maxBinCount = useMemo(
    () => Math.max(1, ...bins.map((b) => b.count)),
    [bins],
  );

  const binWidthData =
    stats.range > 0 ? stats.range / intervalCount : 1;

  // Curva de densidad normal escalada a la frecuencia de cada intervalo
  const normalCurvePath = useMemo(() => {
    if (stats.stdDev <= 0 || stats.range <= 0) return "";
    const steps = 64;
    const points: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const xVal = stats.min + ratio * stats.range;
      const expectedCount =
        normalPdf(xVal, stats.mean, stats.stdDev) * stats.count * binWidthData;
      const clampedY = Math.min(expectedCount, maxBinCount * 1.08);
      const px = PAD_L + ratio * PLOT_W;
      const py = PAD_T + PLOT_H - (clampedY / maxBinCount) * (PLOT_H * 0.88);
      points.push(`${px.toFixed(2)} ${py.toFixed(2)}`);
    }
    return `M ${points.join(" L ")}`;
  }, [stats, binWidthData, maxBinCount]);

  const toX = (value: number) => {
    if (stats.range <= 0) return PAD_L + PLOT_W / 2;
    return PAD_L + ((value - stats.min) / stats.range) * PLOT_W;
  };

  const meanX = toX(stats.mean);
  const medianX = toX(stats.median);
  const unitSuffix = parameter.unit ? ` ${parameter.unit}` : "";

  const activeBin =
    hoveredIdx !== null
      ? bins[hoveredIdx]
      : bins.reduce((best, bin) => (bin.count > best.count ? bin : best), bins[0]);

  const tickCount = 6;
  const xTicks = Array.from({ length: tickCount }, (_, i) => {
    const ratio = i / (tickCount - 1);
    return {
      x: PAD_L + ratio * PLOT_W,
      value: stats.min + ratio * stats.range,
    };
  });

  return (
    <Card className="flex flex-col justify-between gap-4 p-5 sm:p-6">
      {/* Cabecera y 3 presets de intervalos */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">
              Histograma de Frecuencias &amp; Curva Paramétrica
            </h2>
            <span
              title="Los límites [Mín, Máx] se obtienen en O(1) mediante MinHeap y MaxHeap"
              className="text-muted"
            >
              <InfoIcon className="size-4" />
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Visualización empírica con densidad normal superpuesta · Rango{" "}
            <span className="font-mono text-foreground">
              [{stats.min.toFixed(1)}, {stats.max.toFixed(1)}]{unitSuffix}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Presets de intervalos del histograma"
            className="inline-flex rounded-lg border border-border bg-background/80 p-1"
          >
            {HISTOGRAM_INTERVAL_PRESETS.map((preset) => {
              const active = intervalCount === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setIntervalCount(preset);
                    setHoveredIdx(null);
                  }}
                  aria-pressed={active}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {preset} Intervalos
                </button>
              );
            })}
          </div>

          <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs">
            <DownloadIcon className="size-3.5" />
            Descargar
          </Button>
        </div>
      </div>

      {/* Área del gráfico SVG */}
      <div className="relative rounded-xl border border-border/80 bg-background/60 p-3">
        {activeBin && (
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface/90 px-3 py-1.5 font-mono text-[11px]">
            <span className="text-muted">
              Intervalo [{activeBin.from.toFixed(1)}, {activeBin.to.toFixed(1)}
              {unitSuffix}]
            </span>
            <span className="font-semibold text-primary">
              f = {activeBin.count} obs ({activeBin.percentage.toFixed(1)}%)
            </span>
          </div>
        )}

        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="h-auto w-full select-none"
          role="img"
          aria-label={`Histograma de ${parameter.name} con ${intervalCount} intervalos`}
        >
          <defs>
            <linearGradient id="hist-bar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.18" />
            </linearGradient>
            <linearGradient id="hist-bar-active" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary-hover)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Líneas guía horizontales */}
          {[0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = PAD_T + PLOT_H * (1 - fraction * 0.88);
            return (
              <line
                key={fraction}
                x1={PAD_L}
                x2={SVG_W - PAD_R}
                y1={y}
                y2={y}
                stroke="var(--color-border)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            );
          })}

          {/* Barras */}
          {bins.map((bin, idx) => {
            const slotW = PLOT_W / bins.length;
            const gap = Math.max(2, slotW * 0.14);
            const barW = Math.max(3, slotW - gap);
            const barH = (bin.count / maxBinCount) * (PLOT_H * 0.88);
            const x = PAD_L + idx * slotW + gap / 2;
            const y = PAD_T + PLOT_H - barH;
            const isHighlighted =
              hoveredIdx === idx ||
              (hoveredIdx === null && activeBin?.index === idx);

            return (
              <rect
                key={bin.index}
                x={x}
                y={y}
                width={barW}
                height={Math.max(2, barH)}
                rx={2.5}
                fill={isHighlighted ? "url(#hist-bar-active)" : "url(#hist-bar)"}
                stroke={isHighlighted ? "var(--color-primary)" : "transparent"}
                strokeWidth={isHighlighted ? 1.2 : 0}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-opacity"
              />
            );
          })}

          {/* Curva normal */}
          {normalCurvePath && (
            <path
              d={normalCurvePath}
              fill="none"
              stroke="var(--color-primary-hover)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          )}

          {/* Líneas de Media y Mediana */}
          <line
            x1={meanX}
            x2={meanX}
            y1={PAD_T}
            y2={PAD_T + PLOT_H}
            stroke="var(--color-primary)"
            strokeDasharray="4 3"
            strokeWidth="1.5"
          />
          <line
            x1={medianX}
            x2={medianX}
            y1={PAD_T + 8}
            y2={PAD_T + PLOT_H}
            stroke="var(--color-accent)"
            strokeDasharray="2 3"
            strokeWidth="1.5"
          />

          {/* Eje X */}
          <line
            x1={PAD_L}
            x2={SVG_W - PAD_R}
            y1={PAD_T + PLOT_H}
            y2={PAD_T + PLOT_H}
            stroke="var(--color-border-strong)"
            strokeWidth="1"
          />
          {xTicks.map((tick, i) => (
            <text
              key={i}
              x={tick.x}
              y={SVG_H - 10}
              textAnchor="middle"
              fill="var(--color-muted)"
              fontSize="10"
              fontFamily="var(--font-mono)"
            >
              {tick.value.toFixed(1)}
              {unitSuffix}
            </text>
          ))}
        </svg>
      </div>

      {/* Leyenda y pie */}
      <div className="flex flex-col gap-2 text-[11px] text-muted">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs bg-primary" aria-hidden />
            Frecuencia por Intervalo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-primary-hover" aria-hidden />
            Densidad Normal μ = {stats.mean.toFixed(1)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-accent" aria-hidden />
            Mediana Me = {stats.median.toFixed(1)}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
          <span>
            Asimetría:{" "}
            <strong className="text-foreground">
              {stats.skewness >= 0 ? "+" : ""}
              {stats.skewness.toFixed(2)}
            </strong>{" "}
            | Curtosis:{" "}
            <strong className="text-foreground">
              {stats.kurtosis.toFixed(2)}
            </strong>
          </span>
          <span className="text-primary">
            MinHeap: {stats.min.toFixed(1)} · MaxHeap: {stats.max.toFixed(1)} ·
            Rango: {stats.range.toFixed(1)}
          </span>
        </div>
      </div>
    </Card>
  );
}

