"use client";

import { useMemo, useState } from "react";
import {
  analyzeQualitativeParameter,
  type QualitativeParameter,
} from "@/entities/dataset";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import {
  LayersIcon,
  PieChartIcon,
  UsersIcon,
} from "@/shared/ui/icons";

const PALETTE = [
  "#22c3e6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#38bdf8",
  "#a78bfa",
];

export function QualitativeDiagnostics({
  parameter,
}: {
  parameter: QualitativeParameter;
}) {
  const stats = useMemo(
    () => analyzeQualitativeParameter(parameter),
    [parameter],
  );
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  const maxCatCount = useMemo(
    () => Math.max(1, ...stats.categories.map((c) => c.count)),
    [stats.categories],
  );

  // Cálculo de segmentos del anillo (SVG donut)
  const donutSegments = useMemo(() => {
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    const segments: Array<{
      label: string;
      count: number;
      percentage: number;
      color: string;
      dashArray: string;
      dashOffset: number;
    }> = [];
    let offset = 0;

    for (let index = 0; index < stats.categories.length; index++) {
      const cat = stats.categories[index];
      const ratio = stats.count > 0 ? cat.count / stats.count : 0;
      const dashLength = ratio * circumference;
      segments.push({
        label: cat.label,
        count: cat.count,
        percentage: cat.percentage,
        color: PALETTE[index % PALETTE.length],
        dashArray: `${dashLength} ${circumference - dashLength}`,
        dashOffset: -offset,
      });
      offset += dashLength;
    }

    return segments;
  }, [stats]);

  return (
    <div className="flex flex-col gap-6">
      {/* 4 tarjetas KPI cualitativas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex flex-col justify-between gap-4 p-4">
          <div className="flex items-center justify-between">
            <span className="flex size-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <UsersIcon className="size-4" />
            </span>
            <Badge variant="success">100% OK</Badge>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              Tamaño muestral
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-foreground">
              N = {stats.count.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Observaciones categóricas válidas
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-4 p-4">
          <div className="flex items-center justify-between">
            <Badge variant="accent" className="px-2 py-1 text-xs">
              Mo
            </Badge>
            <Badge variant="primary">{stats.modePercentage.toFixed(1)}%</Badge>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              Moda / Categoría dominante
            </p>
            <p className="mt-1 truncate text-xl font-bold text-[#b5a7f8]">
              {stats.mode}
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted">
              Frecuencia absoluta: {stats.modeCount.toLocaleString("en-US")} obs
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-4 p-4">
          <div className="flex items-center justify-between">
            <span className="flex size-8 items-center justify-center rounded-lg border border-accent/30 bg-accent/15 text-[#b5a7f8]">
              <LayersIcon className="size-4" />
            </span>
            <Badge variant="neutral">{parameter.scale}</Badge>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              Categorías únicas
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-foreground">
              k = {stats.uniqueCount}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Niveles distintos detectados
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-4 p-4">
          <div className="flex items-center justify-between">
            <span className="flex size-8 items-center justify-center rounded-lg border border-success/30 bg-success/10 text-success">
              <PieChartIcon className="size-4" />
            </span>
            <Badge variant="success">
              {stats.normalizedDiversityPct.toFixed(0)}% div.
            </Badge>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              Entropía de Shannon (H)
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-success">
              H = {stats.shannonEntropy.toFixed(2)} bits
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Dispersión entre categorías
            </p>
          </div>
        </Card>
      </div>

      {/* Gráficos cualitativos: Barras por categoría + Anillo de proporción */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="flex flex-col justify-between gap-5 p-5 sm:p-6 xl:col-span-7">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Frecuencia por Categoría ({parameter.name})
            </h2>
            <p className="mt-1 text-xs text-muted">
              Conteo absoluto y peso porcentual de cada clase (sin intervalos
              numéricos continuos)
            </p>
          </div>

          <div className="flex flex-col gap-3.5 rounded-xl border border-border/80 bg-background/60 p-4">
            {stats.categories.map((cat, idx) => {
              const color = PALETTE[idx % PALETTE.length];
              const widthPct = (cat.count / maxCatCount) * 100;
              const isActive = hoveredCat === cat.label;

              return (
                <div
                  key={cat.label}
                  onMouseEnter={() => setHoveredCat(cat.label)}
                  onMouseLeave={() => setHoveredCat(null)}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                      {cat.label}
                    </span>
                    <span className="font-mono text-[11px] text-muted">
                      <strong className="text-foreground">
                        {cat.count.toLocaleString("en-US")}
                      </strong>{" "}
                      ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(3, widthPct)}%`,
                        backgroundColor: color,
                        opacity: hoveredCat && !isActive ? 0.45 : 1,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-5 p-5 sm:p-6 xl:col-span-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Distribución Proporcional
            </h2>
            <p className="mt-1 text-xs text-muted">
              Participación relativa de cada categoría sobre N ={" "}
              {stats.count.toLocaleString("en-US")}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-border/80 bg-background/60 p-5 sm:flex-row">
            <svg
              viewBox="0 0 160 160"
              className="size-40 shrink-0 -rotate-90"
              role="img"
              aria-label={`Distribución proporcional de ${parameter.name}`}
            >
              <circle
                cx="80"
                cy="80"
                r="56"
                fill="none"
                stroke="var(--color-surface)"
                strokeWidth="18"
              />
              {donutSegments.map((seg) => (
                <circle
                  key={seg.label}
                  cx="80"
                  cy="80"
                  r="56"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={hoveredCat === seg.label ? 22 : 18}
                  strokeDasharray={seg.dashArray}
                  strokeDashoffset={seg.dashOffset}
                  onMouseEnter={() => setHoveredCat(seg.label)}
                  onMouseLeave={() => setHoveredCat(null)}
                  className="cursor-pointer transition-all"
                />
              ))}
              <g transform="rotate(90 80 80)">
                <text
                  x="80"
                  y="76"
                  textAnchor="middle"
                  fill="var(--color-foreground)"
                  fontSize="16"
                  fontWeight="700"
                  fontFamily="var(--font-mono)"
                >
                  {stats.uniqueCount}
                </text>
                <text
                  x="80"
                  y="94"
                  textAnchor="middle"
                  fill="var(--color-muted)"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                >
                  CATEGORÍAS
                </text>
              </g>
            </svg>

            <ul className="flex w-full flex-col gap-2 text-xs">
              {donutSegments.map((seg) => (
                <li
                  key={seg.label}
                  onMouseEnter={() => setHoveredCat(seg.label)}
                  onMouseLeave={() => setHoveredCat(null)}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1 transition-colors hover:bg-surface"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: seg.color }}
                      aria-hidden
                    />
                    <span className="truncate text-foreground">{seg.label}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted">
                    {seg.percentage.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Tabla de distribución de frecuencias */}
      <Card className="p-5 sm:p-6">
        <div className="border-b border-border/60 pb-4">
          <h3 className="text-sm font-semibold text-foreground">
            Tabla de Frecuencias Cualitativas
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            Frecuencia absoluta, relativa y acumulada de las categorías observadas
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted">
                <th className="py-2.5 pr-4">Categoría</th>
                <th className="py-2.5 px-3">Frec. Absoluta (fᵢ)</th>
                <th className="py-2.5 px-3">Frec. Relativa (%)</th>
                <th className="py-2.5 px-3">Acumulada (Fᵢ)</th>
                <th className="py-2.5 pl-3">Acumulada (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {stats.categories.map((cat, idx) => (
                <tr key={cat.label} className="hover:bg-surface-hover/50">
                  <td className="py-3 pr-4 font-medium text-foreground">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                        aria-hidden
                      />
                      {cat.label}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-foreground">
                    {cat.count.toLocaleString("en-US")}
                  </td>
                  <td className="py-3 px-3 font-mono text-primary">
                    {cat.percentage.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 font-mono text-muted">
                    {cat.cumulativeCount.toLocaleString("en-US")}
                  </td>
                  <td className="py-3 pl-3 font-mono text-muted">
                    {cat.cumulativePercentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
