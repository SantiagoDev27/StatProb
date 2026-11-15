const WIDTH = 320;
const HEIGHT = 120;
const PADDING = 8;
const X_MIN = -4;
const X_MAX = 4;
const Z_CRITICAL = 1.96;

const pdf = (x: number) => Math.exp(-(x * x) / 2);

const toSvgX = (x: number) => PADDING + ((x - X_MIN) / (X_MAX - X_MIN)) * (WIDTH - PADDING * 2);
const toSvgY = (x: number) => HEIGHT - PADDING - pdf(x) * (HEIGHT - PADDING * 2 - 8);
const BASELINE = HEIGHT - PADDING;

function curvePath(from: number, to: number, steps = 80): string {
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = from + ((to - from) * i) / steps;
    points.push(`${toSvgX(x).toFixed(2)} ${toSvgY(x).toFixed(2)}`);
  }
  return `M ${points.join(" L ")}`;
}

function areaPath(from: number, to: number): string {
  return `${curvePath(from, to)} L ${toSvgX(to).toFixed(2)} ${BASELINE} L ${toSvgX(from).toFixed(2)} ${BASELINE} Z`;
}

const LINE = curvePath(X_MIN, X_MAX);
const FULL_AREA = areaPath(X_MIN, X_MAX);
const CENTRAL_AREA = areaPath(-Z_CRITICAL, Z_CRITICAL);

/** Curva decorativa de la distribución normal estándar N(0, 1). */
export function NormalDistributionChart() {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full"
      role="img"
      aria-label="Curva de la distribución normal estándar"
    >
      <defs>
        <linearGradient id="nd-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nd-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="50%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="var(--color-primary)" />
        </linearGradient>
      </defs>

      <line
        x1={PADDING}
        x2={WIDTH - PADDING}
        y1={BASELINE}
        y2={BASELINE}
        stroke="var(--color-border-strong)"
        strokeWidth="1"
      />
      <path d={FULL_AREA} fill="var(--color-accent)" fillOpacity="0.06" />
      <path d={CENTRAL_AREA} fill="url(#nd-fill)" />
      <path d={LINE} fill="none" stroke="url(#nd-stroke)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

