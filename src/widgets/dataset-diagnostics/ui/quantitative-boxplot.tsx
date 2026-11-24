import type { QuantitativeParameter, QuantitativeStats } from "@/entities/dataset";
import { Card } from "@/shared/ui/card";
import { ArrowRightIcon } from "@/shared/ui/icons";

type QuantitativeBoxplotProps = {
  parameter: QuantitativeParameter;
  stats: QuantitativeStats;
};

const SVG_W = 420;
const SVG_H = 190;
const PAD_X = 28;
const PLOT_W = SVG_W - PAD_X * 2;
const CENTER_Y = 88;

export function QuantitativeBoxplot({
  parameter,
  stats,
}: QuantitativeBoxplotProps) {
  const unitSuffix = parameter.unit ? ` ${parameter.unit}` : "";
  const toX = (val: number) =>
    stats.range > 0
      ? PAD_X + ((val - stats.min) / stats.range) * PLOT_W
      : PAD_X + PLOT_W / 2;

  const wMinX = toX(stats.whiskerMin);
  const wMaxX = toX(stats.whiskerMax);
  const q1X = toX(stats.q1);
  const medX = toX(stats.median);
  const q3X = toX(stats.q3);
  const meanX = toX(stats.mean);
  const boxW = Math.max(4, q3X - q1X);
  const boxX = stats.range > 0 ? q1X : medX - boxW / 2;

  return (
    <Card className="flex flex-col justify-between gap-4 p-5 sm:p-6">
      {/* Cabecera */}
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Diagrama de Caja y Bigotes (Boxplot)
        </h2>
        <p className="mt-1 text-xs text-muted">
          Cuartiles Tukey, Rango Intercuartílico (RIC / IQR) y Valores Atípicos
        </p>
      </div>

      {/* SVG Boxplot */}
      <div className="rounded-xl border border-border/80 bg-background/60 p-3">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="h-auto w-full select-none"
          role="img"
          aria-label={`Diagrama de caja y bigotes de ${parameter.name}`}
        >
          {/* Etiqueta IQR */}
          <text
            x={(q1X + q3X) / 2}
            y={30}
            textAnchor="middle"
            fill="var(--color-primary)"
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            RIC / IQR = {stats.iqr.toFixed(1)}
            {unitSuffix}
          </text>
          <path
            d={`M ${q1X} 44 L ${q1X} 38 L ${q3X} 38 L ${q3X} 44`}
            fill="none"
            stroke="var(--color-primary)"
            strokeOpacity="0.6"
            strokeWidth="1"
          />

          {/* Bigotes */}
          <line
            x1={wMinX}
            x2={q1X}
            y1={CENTER_Y}
            y2={CENTER_Y}
            stroke="var(--color-muted)"
            strokeWidth="1.5"
          />
          <line
            x1={q3X}
            x2={wMaxX}
            y1={CENTER_Y}
            y2={CENTER_Y}
            stroke="var(--color-muted)"
            strokeWidth="1.5"
          />
          <line
            x1={wMinX}
            x2={wMinX}
            y1={CENTER_Y - 12}
            y2={CENTER_Y + 12}
            stroke="var(--color-muted)"
            strokeWidth="1.5"
          />
          <line
            x1={wMaxX}
            x2={wMaxX}
            y1={CENTER_Y - 12}
            y2={CENTER_Y + 12}
            stroke="var(--color-muted)"
            strokeWidth="1.5"
          />

          {/* Caja Q1-Q3 */}
          <rect
            x={boxX}
            y={CENTER_Y - 24}
            width={boxW}
            height={48}
            rx={3}
            fill="var(--color-primary)"
            fillOpacity="0.14"
            stroke="var(--color-primary)"
            strokeWidth="1.6"
          />

          {/* Línea Mediana */}
          <line
            x1={medX}
            x2={medX}
            y1={CENTER_Y - 24}
            y2={CENTER_Y + 24}
            stroke="var(--color-foreground)"
            strokeWidth="2"
          />

          {/* Punto Media */}
          <circle cx={meanX} cy={CENTER_Y} r="3.5" fill="var(--color-primary)" />

          {/* Atípicos */}
          {stats.outliers.slice(0, 12).map((outlier, idx) => (
            <circle
              key={`${outlier}-${idx}`}
              cx={toX(outlier)}
              cy={CENTER_Y}
              r="3.2"
              fill="var(--color-danger)"
              fillOpacity="0.85"
              stroke="var(--color-background)"
              strokeWidth="1"
            />
          ))}

          {/* Eje inferior */}
          <line
            x1={PAD_X}
            x2={SVG_W - PAD_X}
            y1={148}
            y2={148}
            stroke="var(--color-border-strong)"
            strokeWidth="1"
          />

          <text
            x={PAD_X}
            y={166}
            textAnchor="start"
            fill="var(--color-muted)"
            fontSize="9.5"
            fontFamily="var(--font-mono)"
          >
            Mín: {stats.min.toFixed(1)}
          </text>
          <text
            x={medX}
            y={166}
            textAnchor="middle"
            fill="var(--color-primary)"
            fontSize="9.5"
            fontFamily="var(--font-mono)"
          >
            Me: {stats.median.toFixed(1)}
          </text>
          <text
            x={SVG_W - PAD_X}
            y={166}
            textAnchor="end"
            fill="var(--color-muted)"
            fontSize="9.5"
            fontFamily="var(--font-mono)"
          >
            Máx: {stats.max.toFixed(1)}
          </text>
        </svg>
      </div>

      {/* Tarjetas de cuartiles y atípicos */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-background/70 p-2.5 text-center">
          <p className="font-mono text-[10px] text-muted">Q1 (25%)</p>
          <p className="mt-1 font-mono text-sm font-bold text-foreground">
            {stats.q1.toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/70 p-2.5 text-center">
          <p className="font-mono text-[10px] text-muted">Mediana (50%)</p>
          <p className="mt-1 font-mono text-sm font-bold text-primary">
            {stats.median.toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/70 p-2.5 text-center">
          <p className="font-mono text-[10px] text-muted">Q3 (75%)</p>
          <p className="mt-1 font-mono text-sm font-bold text-foreground">
            {stats.q3.toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/70 p-2.5 text-center">
          <p className="font-mono text-[10px] text-muted">Atípicos</p>
          <p className="mt-1 font-mono text-sm font-bold text-danger">
            {stats.outliers.length}{" "}
            {stats.outliers.length === 1 ? "caso" : "casos"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted">
        <p>
          El 50% de las observaciones centrales oscilan entre{" "}
          <strong className="text-foreground">
            {stats.q1.toFixed(1)}
            {unitSuffix}
          </strong>{" "}
          y{" "}
          <strong className="text-foreground">
            {stats.q3.toFixed(1)}
            {unitSuffix}
          </strong>
          .
        </p>
        <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-primary">
          IQR <ArrowRightIcon className="size-3" />
        </span>
      </div>
    </Card>
  );
}

