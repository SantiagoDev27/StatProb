import type { DatasetParameter } from "../model/types";

const STORAGE_PREFIX = "statprob:custom-params:";
const CHANGE_EVENT = "statprob:custom-params-changed";

export function getCustomParametersKey(datasetId: string): string {
  return `${STORAGE_PREFIX}${datasetId}`;
}

export function getCustomParametersSnapshot(datasetId: string): string {
  if (typeof window === "undefined") return "[]";
  try {
    return window.sessionStorage.getItem(getCustomParametersKey(datasetId)) ?? "[]";
  } catch {
    return "[]";
  }
}

export function getCustomParametersServerSnapshot(): string {
  return "[]";
}

export function subscribeCustomParameters(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function parseCustomParametersSnapshot(raw: string): DatasetParameter[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as DatasetParameter[]) : [];
  } catch {
    return [];
  }
}

export function loadCustomParameters(datasetId: string): DatasetParameter[] {
  return parseCustomParametersSnapshot(getCustomParametersSnapshot(datasetId));
}

/**
 * Combina los parámetros base del dataset con los creados o editados por el usuario.
 * Si un parámetro guardado comparte `id` con uno existente, lo reemplaza con los datos editados.
 */
export function mergeDatasetParameters(
  baseParameters: DatasetParameter[],
  storedParameters: DatasetParameter[],
): DatasetParameter[] {
  const byId = new Map<string, DatasetParameter>();
  for (const param of storedParameters) {
    byId.set(param.id, param);
  }

  const merged = baseParameters.map((base) => byId.get(base.id) ?? base);
  const baseIds = new Set(baseParameters.map((b) => b.id));

  for (const param of storedParameters) {
    if (!baseIds.has(param.id)) {
      merged.push(param);
    }
  }

  return merged;
}

/** Guarda un parámetro nuevo o actualiza uno existente con el mismo `id`. */
export function saveCustomParameter(
  datasetId: string,
  parameter: DatasetParameter,
): DatasetParameter[] {
  const existing = loadCustomParameters(datasetId);
  const index = existing.findIndex((p) => p.id === parameter.id);
  const next =
    index >= 0
      ? existing.map((item, idx) => (idx === index ? parameter : item))
      : [...existing, parameter];

  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(
        getCustomParametersKey(datasetId),
        JSON.stringify(next),
      );
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Ignorar si sessionStorage no está disponible
    }
  }
  return next;
}
