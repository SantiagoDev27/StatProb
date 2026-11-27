"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Dataset, DatasetParameter } from "../model/types";
import {
  getCustomParametersSnapshot,
  mergeDatasetParameters,
  parseCustomParametersSnapshot,
  subscribeCustomParameters,
  useAllDatasets,
} from "./custom-parameters-storage";

/** Límite máximo de almacenamiento por espacio de trabajo: 10 MB. */
export const MAX_STORAGE_BYTES = 10 * 1024 * 1024;
export const MAX_STORAGE_LABEL = "10 MB";

/**
 * Calcula el tamaño aproximado en bytes UTF-8 de cualquier estructura serializada en JSON.
 */
export function getJsonByteSize(value: unknown): number {
  const serialized = JSON.stringify(value) ?? "";
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(serialized).length;
  }
  return serialized.length;
}

/**
 * Formatea una cantidad de bytes en una etiqueta legible (`B`, `KB` o `MB`).
 */
export function formatStorageBytes(bytes: number): string {
  const safeBytes = Math.max(0, bytes);
  if (safeBytes < 1024) {
    return `${safeBytes} B`;
  }
  if (safeBytes < 1024 * 1024) {
    return `${(safeBytes / 1024).toFixed(1)} KB`;
  }
  return `${(safeBytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Calcula el peso total en bytes de los datasets activos combinando sus parámetros base
 * con los parámetros personalizados guardados en `sessionStorage` (modo prueba).
 */
export function computeDatasetsStorageBytes(
  datasets: readonly Dataset[],
  customParamsByDatasetId: Readonly<Record<string, DatasetParameter[]>> = {},
): number {
  let total = 0;
  for (const dataset of datasets) {
    const customParams = customParamsByDatasetId[dataset.id];
    const effectiveDataset =
      customParams && customParams.length > 0
        ? {
            ...dataset,
            parameters: mergeDatasetParameters(dataset.parameters, customParams),
          }
        : dataset;
    total += getJsonByteSize(effectiveDataset);
  }
  return total;
}

/**
 * Hook reactivo e hydration-safe que calcula los bytes reales consumidos por los
 * datasets activos en el espacio de trabajo actual.
 */
export function useDatasetsStorageBytes(): number {
  const allDatasets = useAllDatasets();

  const rawCustomParamsMap = useSyncExternalStore(
    subscribeCustomParameters,
    () => {
      if (allDatasets.length === 0) return "{}";
      const entries: Record<string, string> = {};
      for (const ds of allDatasets) {
        entries[ds.id] = getCustomParametersSnapshot(ds.id);
      }
      return JSON.stringify(entries);
    },
    () => "{}",
  );

  return useMemo(() => {
    if (allDatasets.length === 0) return 0;
    const customById: Record<string, DatasetParameter[]> = {};
    try {
      const parsed = JSON.parse(rawCustomParamsMap) as Record<string, string>;
      for (const [datasetId, rawParams] of Object.entries(parsed)) {
        const list = parseCustomParametersSnapshot(rawParams);
        if (list.length > 0) {
          customById[datasetId] = list;
        }
      }
    } catch {
      // Ignorar si el snapshot no es JSON válido
    }
    return computeDatasetsStorageBytes(allDatasets, customById);
  }, [allDatasets, rawCustomParamsMap]);
}
