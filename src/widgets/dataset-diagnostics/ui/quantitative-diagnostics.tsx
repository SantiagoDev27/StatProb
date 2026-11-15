import { useMemo } from "react";
import {
  analyzeQuantitativeParameter,
  type QuantitativeParameter,
} from "@/entities/dataset";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { UsersIcon } from "@/shared/ui/icons";
import { QuantitativeBoxplot } from "./quantitative-boxplot";
import { QuantitativeHistogram } from "./quantitative-histogram";

export function QuantitativeDiagnostics({
  parameter,
}: {
  parameter: QuantitativeParameter;
}) {
  const stats = useMemo(
    () => analyzeQuantitativeParameter(parameter),
    [parameter],
  );
  const unitSuffix = parameter.unit ? ` ${parameter.unit}` : "";

  return (
    <div className="flex flex-col gap-6">
      {/* 5 tarjetas de KPIs cuantitativos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
            <p className="mt-1 text-[11px] text-muted">Sin valores nulos</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-4 p-4">
          <div className="flex items-center justify-between">
            <Badge variant="primary" className="px-2 py-1 text-xs">
              μ
            </Badge>
            <Badge variant="accent">±1.96 EE</Badge>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              Media aritmética
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-primary">
              μ = {stats.mean.toFixed(1)}
              <span className="text-sm font-medium text-muted">{unitSuffix}</span>
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted">
              IC 95%: [{stats.ci95[0].toFixed(1)}, {stats.ci95[1].toFixed(1)}]
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-4 p-4">
          <div className="flex items-center justify-between">
            <Badge variant="primary" className="px-2 py-1 text-xs">
              Me
            </Badge>
            <span className="font-mono text-[11px] text-muted">P50</span>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              Mediana (Q2)
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-foreground">
              Me = {stats.median.toFixed(1)}
              <span className="text-sm font-medium text-muted">{unitSuffix}</span>
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted">
              Sesgo: {(stats.mean - stats.median) >= 0 ? "+" : ""}
              {(stats.mean - stats.median).toFixed(2)}
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-4 p-4">
          <div className="flex items-center justify-between">
            <Badge variant="accent" className="px-2 py-1 text-xs">
              Mo
            </Badge>
            <span className="font-mono text-[11px] text-muted">
              f = {stats.modeCount}
            </span>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              Moda primaria
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-foreground">
              Mo = {stats.mode.toFixed(1)}
              <span className="text-sm font-medium text-muted">{unitSuffix}</span>
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted">
              {stats.modeSharePct.toFixed(1)}% frecuencia
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-4 p-4">
          <div className="flex items-center justify-between">
            <Badge variant="success" className="px-2 py-1 text-xs">
              σ
            </Badge>
            <Badge variant="neutral">CV: {stats.cvPct.toFixed(1)}%</Badge>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              Desviación estándar
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-success">
              σ = {stats.stdDev.toFixed(1)}
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted">
              Varianza σ² = {stats.variance.toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      {/* Gráficos cuantitativos: Histograma con 3 presets + Diagrama de Caja */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <QuantitativeHistogram parameter={parameter} stats={stats} />
        </div>
        <div className="xl:col-span-5">
          <QuantitativeBoxplot parameter={parameter} stats={stats} />
        </div>
      </div>
    </div>
  );
}

