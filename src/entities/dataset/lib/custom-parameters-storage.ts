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

export function saveCustomParameter(
  datasetId: string,
  parameter: DatasetParameter,
): DatasetParameter[] {
  const existing = loadCustomParameters(datasetId);
  const next = [...existing, parameter];
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
