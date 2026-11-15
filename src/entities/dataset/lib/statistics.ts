import { MinMaxHeapPair } from "@/shared/lib";
import type { QualitativeParameter, QuantitativeParameter } from "../model/types";

export const HISTOGRAM_INTERVAL_PRESETS = [10, 20, 30] as const;

export type HistogramIntervalPreset = (typeof HISTOGRAM_INTERVAL_PRESETS)[number];

export type HistogramBin = {
  index: number;
  from: number;
  to: number;
  midpoint: number;
  count: number;
  percentage: number;
};

export type QuantitativeStats = {
  count: number;
  /** Obtenido en O(1) desde MinHeap.peek(). */
  min: number;
  /** Obtenido en O(1) desde MaxHeap.peek(). */
  max: number;
  /** Calculado como max - min usando los extremos O(1) de los Heaps. */
  range: number;
  mean: number;
  median: number;
  mode: number;
  modeCount: number;
  modeSharePct: number;
  variance: number;
  stdDev: number;
  cvPct: number;
  standardError: number;
  ci95: [number, number];
  q1: number;
  q3: number;
  iqr: number;
  whiskerMin: number;
  whiskerMax: number;
  outliers: number[];
  skewness: number;
  kurtosis: number;
};

export type QualitativeCategoryStat = {
  label: string;
  count: number;
  percentage: number;
  cumulativeCount: number;
  cumulativePercentage: number;
};

export type QualitativeStats = {
  count: number;
  uniqueCount: number;
  mode: string;
  modeCount: number;
  modePercentage: number;
  shannonEntropy: number;
  normalizedDiversityPct: number;
  categories: QualitativeCategoryStat[];
};

function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1] ?? sorted[base];
  return sorted[base] + rest * (next - sorted[base]);
}

/**
 * Calcula las estadísticas descriptivas de un parámetro cuantitativo.
 * Utiliza `MinMaxHeapPair` (Min-Heap + Max-Heap) para obtener `min` y `max`
 * en tiempo constante O(1) y derivar el rango de los intervalos.
 */
export function analyzeQuantitativeParameter(
  param: QuantitativeParameter,
): QuantitativeStats {
  const { values } = param;
  const count = values.length;

  if (count === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      range: 0,
      mean: 0,
      median: 0,
      mode: 0,
      modeCount: 0,
      modeSharePct: 0,
      variance: 0,
      stdDev: 0,
      cvPct: 0,
      standardError: 0,
      ci95: [0, 0],
      q1: 0,
      q3: 0,
      iqr: 0,
      whiskerMin: 0,
      whiskerMax: 0,
      outliers: [],
      skewness: 0,
      kurtosis: 0,
    };
  }

  // Construcción de Min-Heap y Max-Heap en O(n); consulta de extremos en O(1)
  const heaps = new MinMaxHeapPair(values);
  const min = heaps.min;
  const max = heaps.max;
  const range = heaps.range;

  let sum = 0;
  for (const v of values) sum += v;
  const mean = sum / count;

  let sqDiffSum = 0;
  let cubeDiffSum = 0;
  let fourthDiffSum = 0;
  for (const v of values) {
    const diff = v - mean;
    const sq = diff * diff;
    sqDiffSum += sq;
    cubeDiffSum += sq * diff;
    fourthDiffSum += sq * sq;
  }

  const variance = count > 1 ? sqDiffSum / (count - 1) : 0;
  const stdDev = Math.sqrt(variance);
  const popStdDev = Math.sqrt(sqDiffSum / count);
  const cvPct = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;
  const standardError = stdDev / Math.sqrt(count);
  const ci95: [number, number] = [
    mean - 1.96 * standardError,
    mean + 1.96 * standardError,
  ];

  const skewness =
    popStdDev > 0 ? cubeDiffSum / count / Math.pow(popStdDev, 3) : 0;
  const kurtosis =
    popStdDev > 0 ? fourthDiffSum / count / Math.pow(popStdDev, 4) : 0;

  // Moda (agrupada a 1 decimal en continuas para evitar empates artificiales de flotantes)
  const freqMap = new Map<number, number>();
  const precision = param.scale === "Int32" ? 1 : 10;
  for (const v of values) {
    const key = Math.round(v * precision) / precision;
    freqMap.set(key, (freqMap.get(key) ?? 0) + 1);
  }
  let mode = values[0];
  let modeCount = 0;
  for (const [val, freq] of freqMap.entries()) {
    if (freq > modeCount) {
      mode = val;
      modeCount = freq;
    }
  }
  const modeSharePct = (modeCount / count) * 100;

  // Cuartiles de Tukey y valores atípicos
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const median = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;

  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  const outliers: number[] = [];
  let whiskerMin = max;
  let whiskerMax = min;

  for (const v of sorted) {
    if (v < lowerFence || v > upperFence) {
      outliers.push(v);
    } else {
      if (v < whiskerMin) whiskerMin = v;
      if (v > whiskerMax) whiskerMax = v;
    }
  }

  if (whiskerMin > whiskerMax) {
    whiskerMin = min;
    whiskerMax = max;
  }

  return {
    count,
    min,
    max,
    range,
    mean,
    median,
    mode,
    modeCount,
    modeSharePct,
    variance,
    stdDev,
    cvPct,
    standardError,
    ci95,
    q1,
    q3,
    iqr,
    whiskerMin,
    whiskerMax,
    outliers,
    skewness,
    kurtosis,
  };
}

/**
 * Construye los intervalos del histograma usando `min` y `max` obtenidos en O(1)
 * desde el par Min-Heap / Max-Heap.
 */
export function buildHistogramBins(
  values: number[],
  min: number,
  max: number,
  intervalCount: number,
): HistogramBin[] {
  const safeCount = Math.max(1, intervalCount);
  const total = values.length;

  if (total === 0) return [];

  const range = max - min;
  const step = range > 0 ? range / safeCount : 1;
  const counts = new Array<number>(safeCount).fill(0);

  for (const value of values) {
    const rawIdx = range > 0 ? Math.floor((value - min) / step) : 0;
    const idx = Math.min(safeCount - 1, Math.max(0, rawIdx));
    counts[idx] += 1;
  }

  return counts.map((count, index) => {
    const from = min + index * step;
    const to = index === safeCount - 1 ? max : from + step;
    return {
      index,
      from,
      to,
      midpoint: (from + to) / 2,
      count,
      percentage: (count / total) * 100,
    };
  });
}

/** Calcula la distribución de frecuencias, moda y diversidad para un parámetro cualitativo. */
export function analyzeQualitativeParameter(
  param: QualitativeParameter,
): QualitativeStats {
  const { values } = param;
  const count = values.length;

  if (count === 0) {
    return {
      count: 0,
      uniqueCount: 0,
      mode: "—",
      modeCount: 0,
      modePercentage: 0,
      shannonEntropy: 0,
      normalizedDiversityPct: 0,
      categories: [],
    };
  }

  const freqMap = new Map<string, number>();
  for (const raw of values) {
    const label = raw.trim();
    if (!label) continue;
    freqMap.set(label, (freqMap.get(label) ?? 0) + 1);
  }

  const sortedEntries = Array.from(freqMap.entries()).sort((a, b) => b[1] - a[1]);
  const uniqueCount = sortedEntries.length;

  let cumulative = 0;
  let shannonEntropy = 0;

  const categories: QualitativeCategoryStat[] = sortedEntries.map(
    ([label, catCount]) => {
      cumulative += catCount;
      const p = catCount / count;
      if (p > 0) shannonEntropy -= p * Math.log2(p);

      return {
        label,
        count: catCount,
        percentage: p * 100,
        cumulativeCount: cumulative,
        cumulativePercentage: (cumulative / count) * 100,
      };
    },
  );

  const maxEntropy = uniqueCount > 1 ? Math.log2(uniqueCount) : 0;
  const normalizedDiversityPct =
    maxEntropy > 0 ? (shannonEntropy / maxEntropy) * 100 : 0;

  const top = categories[0];

  return {
    count,
    uniqueCount,
    mode: top?.label ?? "—",
    modeCount: top?.count ?? 0,
    modePercentage: top?.percentage ?? 0,
    shannonEntropy,
    normalizedDiversityPct,
    categories,
  };
}

