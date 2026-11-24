import { onValue, ref, remove, set } from "firebase/database";
import { firebaseDb } from "@/shared/api";
import type { Dataset, DatasetParameter } from "../model/types";

type StoredDatasetRecord = Dataset & {
  createdAt?: number;
};

/**
 * Elimina recursivamente propiedades con valor `undefined`, ya que
 * Firebase Realtime Database rechaza objetos que contengan claves `undefined`.
 */
function sanitizeForRtdb<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForRtdb(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== undefined) {
        cleaned[key] = sanitizeForRtdb(val);
      }
    }
    return cleaned as T;
  }
  return value;
}

/**
 * Normaliza un parámetro leído desde Firebase Realtime Database asegurando
 * que `values`, `labels` y `levels` sean arreglos válidos.
 */
function normalizeParameterFromRtdb(raw: unknown): DatasetParameter | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === "string" ? obj.id : "";
  const name = typeof obj.name === "string" ? obj.name : "";
  if (!id || !name) return null;

  const rawValues = Array.isArray(obj.values)
    ? obj.values
    : obj.values && typeof obj.values === "object"
      ? Object.values(obj.values as Record<string, unknown>)
      : [];

  const rawLabels = Array.isArray(obj.labels)
    ? obj.labels.map(String)
    : obj.labels && typeof obj.labels === "object"
      ? Object.values(obj.labels as Record<string, unknown>).map(String)
      : undefined;

  if (obj.type === "qualitative") {
    const rawLevels = Array.isArray(obj.levels)
      ? obj.levels.map(String)
      : obj.levels && typeof obj.levels === "object"
        ? Object.values(obj.levels as Record<string, unknown>).map(String)
        : undefined;

    return {
      id,
      name,
      type: "qualitative",
      scale: obj.scale === "Nominal" ? "Nominal" : "Ordinal",
      values: rawValues.map(String),
      ...(rawLabels ? { labels: rawLabels } : {}),
      ...(rawLevels ? { levels: rawLevels } : {}),
    };
  }

  return {
    id,
    name,
    type: "quantitative",
    scale: obj.scale === "Int32" ? "Int32" : "Float64",
    ...(typeof obj.unit === "string" && obj.unit ? { unit: obj.unit } : {}),
    values: rawValues.map((v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }),
    ...(rawLabels ? { labels: rawLabels } : {}),
  };
}

/**
 * Normaliza un Dataset leído desde Firebase Realtime Database.
 */
function normalizeDatasetFromRtdb(
  key: string,
  raw: unknown,
): StoredDatasetRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === "string" && obj.id ? obj.id : key;
  const name = typeof obj.name === "string" ? obj.name : id;

  const rawParams = Array.isArray(obj.parameters)
    ? obj.parameters
    : obj.parameters && typeof obj.parameters === "object"
      ? Object.values(obj.parameters as Record<string, unknown>)
      : [];

  const parameters = rawParams
    .map(normalizeParameterFromRtdb)
    .filter((p): p is DatasetParameter => p !== null);

  const kind =
    obj.kind === "grouped" || obj.kind === "direct" ? obj.kind : "individual";
  const format = obj.format === "XLSX" ? "XLSX" : "CSV";

  return {
    id,
    name,
    fileName:
      typeof obj.fileName === "string" && obj.fileName
        ? obj.fileName
        : `${name}`,
    sidebarName:
      typeof obj.sidebarName === "string" && obj.sidebarName
        ? obj.sidebarName
        : name.length > 22
          ? `${name.slice(0, 22)}...`
          : name,
    repositoryLabel:
      typeof obj.repositoryLabel === "string"
        ? obj.repositoryLabel
        : "Laboratorio_Manual",
    description:
      typeof obj.description === "string"
        ? obj.description
        : "Dataset creado manualmente por el usuario en StatProb.",
    format,
    createdLabel:
      typeof obj.createdLabel === "string"
        ? obj.createdLabel
        : "Guardado en la nube · Manual",
    kindLabel:
      typeof obj.kindLabel === "string" ? obj.kindLabel : "Manual Individual",
    kind,
    sampleSize:
      typeof obj.sampleSize === "string"
        ? obj.sampleSize
        : (parameters[0]?.values.length ?? 0).toLocaleString("en-US"),
    variablesCount:
      typeof obj.variablesCount === "number"
        ? obj.variablesCount
        : parameters.length,
    sizeLabel: typeof obj.sizeLabel === "string" ? obj.sizeLabel : "1 KB",
    hasSecondaryAction: Boolean(obj.hasSecondaryAction ?? true),
    parameters,
    createdAt: typeof obj.createdAt === "number" ? obj.createdAt : 0,
  };
}

/**
 * Guarda o actualiza un Dataset en Firebase Realtime Database bajo `users/{uid}/datasets/{datasetId}`.
 */
export async function saveDatasetInDb(
  uid: string,
  dataset: Dataset,
  createdAt?: number,
): Promise<void> {
  const payload: StoredDatasetRecord = sanitizeForRtdb({
    ...dataset,
    createdAt: createdAt ?? Date.now(),
  });
  await set(ref(firebaseDb, `users/${uid}/datasets/${dataset.id}`), payload);
}

/**
 * Elimina un Dataset de Firebase Realtime Database (`users/{uid}/datasets/{datasetId}`).
 */
export async function deleteDatasetInDb(
  uid: string,
  datasetId: string,
): Promise<void> {
  await remove(ref(firebaseDb, `users/${uid}/datasets/${datasetId}`));
}

/**
 * Reemplaza el mapa completo de datasets del usuario en Realtime Database.
 * Se utiliza para sincronizar operaciones de Deshacer / Rehacer (`Ctrl + Z` / `Ctrl + Y`).
 */
export async function replaceAllDatasetsInDb(
  uid: string,
  datasets: readonly Dataset[],
): Promise<void> {
  const map: Record<string, StoredDatasetRecord> = {};
  const now = Date.now();
  datasets.forEach((ds, idx) => {
    map[ds.id] = sanitizeForRtdb({
      ...ds,
      createdAt: now - idx,
    });
  });
  await set(ref(firebaseDb, `users/${uid}/datasets`), map);
}

/**
 * Escucha en tiempo real los datasets del usuario en `users/{uid}/datasets`,
 * ordenados del más reciente al más antiguo.
 */
export function subscribeUserDatasetsInDb(
  uid: string,
  onDatasets: (datasets: Dataset[]) => void,
): () => void {
  const datasetsRef = ref(firebaseDb, `users/${uid}/datasets`);
  return onValue(
    datasetsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onDatasets([]);
        return;
      }

      const rawMap = snapshot.val() as Record<string, unknown> | null;
      if (!rawMap || typeof rawMap !== "object") {
        onDatasets([]);
        return;
      }

      const records: StoredDatasetRecord[] = [];
      for (const [key, value] of Object.entries(rawMap)) {
        const normalized = normalizeDatasetFromRtdb(key, value);
        if (normalized) {
          records.push(normalized);
        }
      }

      // Más recientes primero
      records.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

      const datasets: Dataset[] = records.map((record) => {
        const { createdAt: _ignored, ...dataset } = record;
        void _ignored;
        return dataset;
      });
      onDatasets(datasets);
    },
    () => {
      onDatasets([]);
    },
  );
}
