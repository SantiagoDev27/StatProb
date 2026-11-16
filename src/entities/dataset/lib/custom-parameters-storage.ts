"use client";

import { useMemo, useSyncExternalStore } from "react";
import { DoublyLinkedList, Stack } from "@/shared/lib";
import { MOCK_DATASETS } from "../model/mock-datasets";
import type { Dataset, DatasetParameter } from "../model/types";

const STORAGE_PREFIX = "statprob:custom-params:";
const DATASETS_STORAGE_KEY = "statprob:custom-datasets";
const DELETED_DATASETS_STORAGE_KEY = "statprob:deleted-dataset-ids";
const CHANGE_EVENT = "statprob:custom-params-changed";

/**
 * Instantánea del estado de los datasets almacenados para la Pila de Deshacer / Rehacer
 * (`datasetsUndoStack` / `datasetsRedoStack`).
 */
type DatasetsStorageSnapshot = {
  customDatasets: Dataset[];
  deletedIds: string[];
  paramsByDatasetId: Record<string, DatasetParameter[]>;
};

const datasetsUndoStack = new Stack<DatasetsStorageSnapshot>(50);
const datasetsRedoStack = new Stack<DatasetsStorageSnapshot>(50);

function captureDatasetsStorageSnapshot(): DatasetsStorageSnapshot {
  const customDatasets = loadCustomDatasets();
  const deletedIds = loadDeletedDatasetIds();
  const paramsByDatasetId: Record<string, DatasetParameter[]> = {};

  if (typeof window !== "undefined") {
    const allIds = new Set<string>([
      ...MOCK_DATASETS.map((d) => d.id),
      ...customDatasets.map((d) => d.id),
      ...deletedIds,
    ]);
    for (const id of allIds) {
      paramsByDatasetId[id] = loadCustomParameters(id);
    }
  }

  return {
    customDatasets,
    deletedIds,
    paramsByDatasetId,
  };
}

function applyDatasetsStorageSnapshot(snapshot: DatasetsStorageSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      DATASETS_STORAGE_KEY,
      JSON.stringify(snapshot.customDatasets),
    );
    window.sessionStorage.setItem(
      DELETED_DATASETS_STORAGE_KEY,
      JSON.stringify(snapshot.deletedIds),
    );
    for (const [datasetId, params] of Object.entries(
      snapshot.paramsByDatasetId,
    )) {
      if (params.length > 0) {
        window.sessionStorage.setItem(
          getCustomParametersKey(datasetId),
          JSON.stringify(params),
        );
      } else {
        window.sessionStorage.removeItem(getCustomParametersKey(datasetId));
      }
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Ignorar si sessionStorage no está disponible
  }
}

function pushCurrentStateToUndoStack(): void {
  if (typeof window === "undefined") return;
  datasetsUndoStack.push(captureDatasetsStorageSnapshot());
  datasetsRedoStack.clear();
}

/**
 * Deshace la última eliminación o modificación de datasets (`Ctrl + Z`)
 * desapilando el estado anterior desde `datasetsUndoStack.pop()`.
 */
export function undoDatasetsChange(): boolean {
  if (datasetsUndoStack.isEmpty) return false;
  const current = captureDatasetsStorageSnapshot();
  const previous = datasetsUndoStack.pop();
  if (!previous) return false;

  datasetsRedoStack.push(current);
  applyDatasetsStorageSnapshot(previous);
  return true;
}

/**
 * Rehace el último cambio deshecho sobre los datasets (`Ctrl + Y`)
 * desapilando desde `datasetsRedoStack.pop()`.
 */
export function redoDatasetsChange(): boolean {
  if (datasetsRedoStack.isEmpty) return false;
  const current = captureDatasetsStorageSnapshot();
  const next = datasetsRedoStack.pop();
  if (!next) return false;

  datasetsUndoStack.push(current);
  applyDatasetsStorageSnapshot(next);
  return true;
}

export function getDatasetsUndoRedoCounts(): string {
  return `${datasetsUndoStack.size}:${datasetsRedoStack.size}`;
}

export function getDatasetsUndoRedoServerCounts(): string {
  return "0:0";
}

export function useDatasetsUndoRedo(): {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
} {
  const rawCounts = useSyncExternalStore(
    subscribeCustomParameters,
    getDatasetsUndoRedoCounts,
    getDatasetsUndoRedoServerCounts,
  );
  const [undoStr, redoStr] = rawCounts.split(":");
  const undoCount = Number(undoStr) || 0;
  const redoCount = Number(redoStr) || 0;
  return {
    canUndo: undoCount > 0,
    canRedo: redoCount > 0,
    undoCount,
    redoCount,
  };
}

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

export function getCustomDatasetsSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return window.sessionStorage.getItem(DATASETS_STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function getDeletedDatasetIdsSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return window.sessionStorage.getItem(DELETED_DATASETS_STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
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

export function parseCustomDatasetsSnapshot(raw: string): Dataset[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Dataset[]) : [];
  } catch {
    return [];
  }
}

export function parseDeletedDatasetIdsSnapshot(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function loadCustomParameters(datasetId: string): DatasetParameter[] {
  return parseCustomParametersSnapshot(getCustomParametersSnapshot(datasetId));
}

export function loadCustomDatasets(): Dataset[] {
  return parseCustomDatasetsSnapshot(getCustomDatasetsSnapshot());
}

export function loadDeletedDatasetIds(): string[] {
  return parseDeletedDatasetIdsSnapshot(getDeletedDatasetIdsSnapshot());
}

/**
 * Construye la **Lista Doblemente Enlazada (`DoublyLinkedList<Dataset>`)** que
 * almacena todos los datasets activos de la sesión.
 *
 * - Cada dataset se inserta como un `DoublyLinkedNode<Dataset>` con punteros `prev` y `next`.
 * - Los datasets eliminados por el usuario son omitidos al poblar los nodos.
 */
export function buildDatasetsLinkedList(
  customDatasets: readonly Dataset[],
  deletedIds: readonly string[],
): DoublyLinkedList<Dataset> {
  const deletedSet = new Set(deletedIds);
  const list = new DoublyLinkedList<Dataset>();

  for (const custom of customDatasets) {
    if (!deletedSet.has(custom.id)) {
      list.append(custom);
    }
  }

  for (const mock of MOCK_DATASETS) {
    if (!deletedSet.has(mock.id)) {
      list.append(mock);
    }
  }

  return list;
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

/** Guarda un parámetro nuevo o actualiza uno existente dentro de un dataset. */
export function saveCustomParameter(
  datasetId: string,
  parameter: DatasetParameter,
): DatasetParameter[] {
  pushCurrentStateToUndoStack();
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

/**
 * Inserta un nuevo Dataset al inicio (`prepend`, O(1)) o actualiza uno existente
 * empleando una `DoublyLinkedList<Dataset>`.
 */
export function saveCustomDataset(dataset: Dataset): Dataset[] {
  pushCurrentStateToUndoStack();
  const customList = DoublyLinkedList.fromIterable(loadCustomDatasets());
  const existingNode = customList.findNode((d) => d.id === dataset.id);

  if (existingNode) {
    existingNode.value = dataset;
  } else {
    customList.prepend(dataset);
  }

  const nextCustomArray = customList.toArray();

  if (typeof window !== "undefined") {
    try {
      const deletedIds = loadDeletedDatasetIds().filter(
        (id) => id !== dataset.id,
      );
      window.sessionStorage.setItem(
        DELETED_DATASETS_STORAGE_KEY,
        JSON.stringify(deletedIds),
      );
      window.sessionStorage.setItem(
        DATASETS_STORAGE_KEY,
        JSON.stringify(nextCustomArray),
      );
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Ignorar si sessionStorage no está disponible
    }
  }
  return nextCustomArray;
}

/**
 * Elimina un Dataset de la **Lista Doblemente Enlazada (`DoublyLinkedList<Dataset>`)**
 * desconectando su nodo (`removeWhere` -> `removeNode` en O(1) al reasignar `prev` y `next`)
 * y sincronizando el estado persistido de la sesión.
 */
export function deleteDatasetById(datasetId: string): boolean {
  const customDatasets = loadCustomDatasets();
  const deletedIds = loadDeletedDatasetIds();
  const fullLinkedList = buildDatasetsLinkedList(customDatasets, deletedIds);

  // Verificamos primero que el nodo exista en la Lista Doblemente Enlazada
  if (!fullLinkedList.findNode((d) => d.id === datasetId)) {
    return false;
  }

  // Apilamos el estado previo en la Pila de Deshacer antes de eliminar el nodo
  pushCurrentStateToUndoStack();

  // Eliminamos el nodo directamente en la Lista Doblemente Enlazada
  fullLinkedList.removeWhere((d) => d.id === datasetId);

  // Si también estaba en la lista de datasets creados por el usuario, lo desconectamos allí
  const customLinkedList = DoublyLinkedList.fromIterable(customDatasets);
  customLinkedList.removeWhere((d) => d.id === datasetId);

  const nextDeletedIds = deletedIds.includes(datasetId)
    ? deletedIds
    : [...deletedIds, datasetId];

  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(
        DATASETS_STORAGE_KEY,
        JSON.stringify(customLinkedList.toArray()),
      );
      window.sessionStorage.setItem(
        DELETED_DATASETS_STORAGE_KEY,
        JSON.stringify(nextDeletedIds),
      );
      window.sessionStorage.removeItem(getCustomParametersKey(datasetId));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Ignorar si sessionStorage no está disponible
    }
  }

  return true;
}

/**
 * Hook reactivo que devuelve la **Lista Doblemente Enlazada (`DoublyLinkedList<Dataset>`)**
 * con todos los datasets activos.
 */
export function useDatasetsLinkedList(): DoublyLinkedList<Dataset> {
  const rawDatasets = useSyncExternalStore(
    subscribeCustomParameters,
    getCustomDatasetsSnapshot,
    getCustomParametersServerSnapshot,
  );
  const rawDeletedIds = useSyncExternalStore(
    subscribeCustomParameters,
    getDeletedDatasetIdsSnapshot,
    getCustomParametersServerSnapshot,
  );

  return useMemo(() => {
    const customDatasets = parseCustomDatasetsSnapshot(rawDatasets);
    const deletedIds = parseDeletedDatasetIdsSnapshot(rawDeletedIds);
    return buildDatasetsLinkedList(customDatasets, deletedIds);
  }, [rawDatasets, rawDeletedIds]);
}

/**
 * Hook reactivo que recorre la `DoublyLinkedList<Dataset>` desde `head` hasta `tail`
 * (`linkedList.toArray()`) para entregar los datasets a los componentes de la interfaz.
 */
export function useAllDatasets(): Dataset[] {
  const linkedList = useDatasetsLinkedList();
  return useMemo(() => linkedList.toArray(), [linkedList]);
}

/**
 * Hook reactivo que busca un dataset por `id` recorriendo los nodos de la
 * `DoublyLinkedList<Dataset>` mediante `findNode`.
 */
export function useDatasetById(
  id: string,
  fallbackDataset?: Dataset,
): Dataset | undefined {
  const linkedList = useDatasetsLinkedList();
  return useMemo(
    () => linkedList.findNode((d) => d.id === id)?.value ?? fallbackDataset,
    [linkedList, id, fallbackDataset],
  );
}
