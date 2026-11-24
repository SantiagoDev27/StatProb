"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useMemo, useSyncExternalStore } from "react";
import { firebaseAuth } from "@/shared/api";
import { DoublyLinkedList, Stack } from "@/shared/lib";
import { MOCK_DATASETS } from "../model/mock-datasets";
import type { Dataset, DatasetParameter } from "../model/types";
import {
  deleteDatasetInDb,
  replaceAllDatasetsInDb,
  saveDatasetInDb,
  subscribeUserDatasetsInDb,
} from "./dataset-db";

const STORAGE_PREFIX = "statprob:custom-params:";
const DATASETS_STORAGE_KEY = "statprob:custom-datasets";
const DELETED_DATASETS_STORAGE_KEY = "statprob:deleted-dataset-ids";
const CHANGE_EVENT = "statprob:custom-params-changed";

/**
 * Estado sincronizado con Firebase Auth + Firebase Realtime Database.
 * - `activeFirebaseUid === null`: usuario de prueba (`local/local`), usa `MOCK_DATASETS` + `sessionStorage`.
 * - `activeFirebaseUid !== null`: usuario real autenticado, muestra y persiste SOLO sus datasets en Realtime Database.
 */
let authSyncInitialized = false;
let authResolved = false;
let remoteInitialLoaded = false;
let activeFirebaseUid: string | null = null;
let remoteDatasets: Dataset[] = [];
let remoteDatasetsRawSnapshot = "[]";
let unsubscribeRemoteDatasets: (() => void) | null = null;

function notifyDatasetSubscribers(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

function setRemoteDatasetsState(nextDatasets: Dataset[]): void {
  remoteDatasets = nextDatasets;
  remoteDatasetsRawSnapshot = JSON.stringify(nextDatasets);
  notifyDatasetSubscribers();
}

function isDatasetsLoadingNow(): boolean {
  return !authResolved || (activeFirebaseUid !== null && !remoteInitialLoaded);
}

/**
 * Limpia completamente el estado local y en memoria de datasets, parámetros
 * y pilas de Deshacer/Rehacer (se invoca al cerrar sesión o cambiar de cuenta).
 */
export function resetDatasetsClientState(): void {
  if (unsubscribeRemoteDatasets) {
    unsubscribeRemoteDatasets();
    unsubscribeRemoteDatasets = null;
  }
  activeFirebaseUid = null;
  remoteInitialLoaded = false;
  remoteDatasets = [];
  remoteDatasetsRawSnapshot = "[]";
  datasetsUndoStack.clear();
  datasetsRedoStack.clear();

  if (typeof window !== "undefined") {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key && key.startsWith("statprob:")) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        window.sessionStorage.removeItem(key);
      }
      window.localStorage.removeItem("statprob:local-profile-photo");
    } catch {
      // Ignorar si storage no está disponible
    }
    notifyDatasetSubscribers();
  }
}

function ensureAuthDatasetsSync(): void {
  if (typeof window === "undefined" || authSyncInitialized) return;
  authSyncInitialized = true;

  onAuthStateChanged(firebaseAuth, (firebaseUser) => {
    if (unsubscribeRemoteDatasets) {
      unsubscribeRemoteDatasets();
      unsubscribeRemoteDatasets = null;
    }

    const nextUid = firebaseUser?.uid ?? null;
    if (nextUid !== activeFirebaseUid) {
      // Al cambiar de usuario, reiniciamos las pilas de Undo/Redo para no mezclar historiales
      datasetsUndoStack.clear();
      datasetsRedoStack.clear();
    }

    authResolved = true;
    activeFirebaseUid = nextUid;

    if (!nextUid) {
      remoteInitialLoaded = false;
      setRemoteDatasetsState([]);
      return;
    }

    // Esperamos el primer snapshot de Realtime Database sin mostrar MOCK_DATASETS
    remoteInitialLoaded = false;
    setRemoteDatasetsState([]);

    unsubscribeRemoteDatasets = subscribeUserDatasetsInDb(
      nextUid,
      (datasets) => {
        if (activeFirebaseUid === nextUid) {
          remoteInitialLoaded = true;
          setRemoteDatasetsState(datasets);
        }
      },
    );
  });
}

/**
 * Instantánea del estado de los datasets almacenados para la Pila de Deshacer / Rehacer
 * (`datasetsUndoStack` / `datasetsRedoStack`).
 */
type DatasetsStorageSnapshot = {
  mode: "local" | "remote";
  customDatasets: Dataset[];
  deletedIds: string[];
  paramsByDatasetId: Record<string, DatasetParameter[]>;
};

const datasetsUndoStack = new Stack<DatasetsStorageSnapshot>(50);
const datasetsRedoStack = new Stack<DatasetsStorageSnapshot>(50);

function captureDatasetsStorageSnapshot(): DatasetsStorageSnapshot {
  if (activeFirebaseUid) {
    return {
      mode: "remote",
      customDatasets: remoteDatasets.map((ds) => ({
        ...ds,
        parameters: ds.parameters.map((p) => ({ ...p })),
      })),
      deletedIds: [],
      paramsByDatasetId: {},
    };
  }

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
    mode: "local",
    customDatasets,
    deletedIds,
    paramsByDatasetId,
  };
}

function applyDatasetsStorageSnapshot(snapshot: DatasetsStorageSnapshot): void {
  if (typeof window === "undefined") return;

  if (activeFirebaseUid && snapshot.mode === "remote") {
    setRemoteDatasetsState(snapshot.customDatasets);
    void replaceAllDatasetsInDb(activeFirebaseUid, snapshot.customDatasets).catch(
      () => {},
    );
    return;
  }

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
    notifyDatasetSubscribers();
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
  if (activeFirebaseUid) {
    // Para usuarios reales los parámetros ya viven dentro del Dataset en Realtime Database
    return "[]";
  }
  try {
    return (
      window.sessionStorage.getItem(getCustomParametersKey(datasetId)) ?? "[]"
    );
  } catch {
    return "[]";
  }
}

export function getCustomParametersServerSnapshot(): string {
  return "[]";
}

export function getCustomDatasetsSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  ensureAuthDatasetsSync();
  if (activeFirebaseUid) {
    return remoteDatasetsRawSnapshot;
  }
  try {
    return window.sessionStorage.getItem(DATASETS_STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function getDeletedDatasetIdsSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  ensureAuthDatasetsSync();
  if (activeFirebaseUid) {
    return "[]";
  }
  try {
    return window.sessionStorage.getItem(DELETED_DATASETS_STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function getAuthUidSnapshot(): string {
  if (typeof window === "undefined") return "";
  ensureAuthDatasetsSync();
  return activeFirebaseUid ?? "";
}

function getAuthUidServerSnapshot(): string {
  return "";
}

export function subscribeCustomParameters(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  ensureAuthDatasetsSync();
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
 * - Si `includeMockDatasets` es `true` (usuario de prueba `local/local`), incluye
 *   los datasets creados + `MOCK_DATASETS`.
 * - Si `includeMockDatasets` es `false` (usuario autenticado con Firebase), incluye
 *   exclusivamente los datasets creados por el usuario en Realtime Database.
 */
export function buildDatasetsLinkedList(
  customDatasets: readonly Dataset[],
  deletedIds: readonly string[],
  includeMockDatasets = true,
): DoublyLinkedList<Dataset> {
  const deletedSet = new Set(deletedIds);
  const list = new DoublyLinkedList<Dataset>();

  for (const custom of customDatasets) {
    if (!deletedSet.has(custom.id)) {
      list.append(custom);
    }
  }

  if (includeMockDatasets) {
    for (const mock of MOCK_DATASETS) {
      if (!deletedSet.has(mock.id)) {
        list.append(mock);
      }
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

/**
 * Guarda un parámetro nuevo o actualiza uno existente dentro de un dataset.
 * - Para usuarios reales: actualiza el Dataset completo en Firebase Realtime Database.
 * - Para el usuario de prueba: lo guarda en `sessionStorage`.
 */
export function saveCustomParameter(
  datasetId: string,
  parameter: DatasetParameter,
): DatasetParameter[] {
  pushCurrentStateToUndoStack();

  if (activeFirebaseUid) {
    const uid = activeFirebaseUid;
    const targetDataset = remoteDatasets.find((d) => d.id === datasetId);
    if (!targetDataset) return [parameter];

    const updatedParameters = mergeDatasetParameters(targetDataset.parameters, [
      parameter,
    ]);
    const obsCount = updatedParameters[0]?.values.length ?? 0;
    const updatedDataset: Dataset = {
      ...targetDataset,
      parameters: updatedParameters,
      variablesCount: updatedParameters.length,
      sampleSize: obsCount.toLocaleString("en-US"),
      sizeLabel: `${Math.max(1, Math.round(obsCount * updatedParameters.length * 0.4))} KB`,
    };

    const nextList = remoteDatasets.map((d) =>
      d.id === datasetId ? updatedDataset : d,
    );
    setRemoteDatasetsState(nextList);
    void saveDatasetInDb(uid, updatedDataset).catch(() => {});
    return updatedParameters;
  }

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
      notifyDatasetSubscribers();
    } catch {
      // Ignorar si sessionStorage no está disponible
    }
  }
  return next;
}

/**
 * Inserta un nuevo Dataset al inicio (`prepend`, O(1)) o actualiza uno existente
 * empleando una `DoublyLinkedList<Dataset>`, sincronizando con Firebase Realtime Database
 * cuando el usuario está autenticado.
 */
export function saveCustomDataset(dataset: Dataset): Dataset[] {
  pushCurrentStateToUndoStack();

  if (activeFirebaseUid) {
    const uid = activeFirebaseUid;
    const list = DoublyLinkedList.fromIterable(remoteDatasets);
    const existingNode = list.findNode((d) => d.id === dataset.id);

    if (existingNode) {
      existingNode.value = dataset;
    } else {
      list.prepend(dataset);
    }

    const nextArray = list.toArray();
    setRemoteDatasetsState(nextArray);
    void saveDatasetInDb(uid, dataset).catch(() => {});
    return nextArray;
  }

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
      notifyDatasetSubscribers();
    } catch {
      // Ignorar si sessionStorage no está disponible
    }
  }
  return nextCustomArray;
}

/**
 * Elimina un Dataset de la **Lista Doblemente Enlazada (`DoublyLinkedList<Dataset>`)**
 * desconectando su nodo (`removeWhere` -> `removeNode` en O(1) al reasignar `prev` y `next`)
 * y actualizando Firebase Realtime Database (o `sessionStorage` en modo prueba).
 */
export function deleteDatasetById(datasetId: string): boolean {
  if (activeFirebaseUid) {
    const uid = activeFirebaseUid;
    const list = DoublyLinkedList.fromIterable(remoteDatasets);
    if (!list.findNode((d) => d.id === datasetId)) {
      return false;
    }

    pushCurrentStateToUndoStack();
    list.removeWhere((d) => d.id === datasetId);
    setRemoteDatasetsState(list.toArray());
    void deleteDatasetInDb(uid, datasetId).catch(() => {});
    return true;
  }

  const customDatasets = loadCustomDatasets();
  const deletedIds = loadDeletedDatasetIds();
  const fullLinkedList = buildDatasetsLinkedList(
    customDatasets,
    deletedIds,
    true,
  );

  if (!fullLinkedList.findNode((d) => d.id === datasetId)) {
    return false;
  }

  pushCurrentStateToUndoStack();
  fullLinkedList.removeWhere((d) => d.id === datasetId);

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
      notifyDatasetSubscribers();
    } catch {
      // Ignorar si sessionStorage no está disponible
    }
  }

  return true;
}

function getDatasetsLoadingSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  ensureAuthDatasetsSync();
  return isDatasetsLoadingNow();
}

function getDatasetsLoadingServerSnapshot(): boolean {
  return true;
}

/**
 * Indica si aún se está resolviendo la sesión de Firebase o la carga inicial
 * de datasets desde Realtime Database.
 */
export function useDatasetsLoading(): boolean {
  return useSyncExternalStore(
    subscribeCustomParameters,
    getDatasetsLoadingSnapshot,
    getDatasetsLoadingServerSnapshot,
  );
}

/**
 * Hook reactivo que devuelve la **Lista Doblemente Enlazada (`DoublyLinkedList<Dataset>`)**
 * con todos los datasets activos (solo los del usuario en Realtime Database si está
 * autenticado; o los de prueba si está en modo `local/local`).
 */
export function useDatasetsLinkedList(): DoublyLinkedList<Dataset> {
  const isLoading = useDatasetsLoading();
  const authUid = useSyncExternalStore(
    subscribeCustomParameters,
    getAuthUidSnapshot,
    getAuthUidServerSnapshot,
  );
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
    if (isLoading) {
      return new DoublyLinkedList<Dataset>();
    }
    const customDatasets = parseCustomDatasetsSnapshot(rawDatasets);
    const deletedIds = parseDeletedDatasetIdsSnapshot(rawDeletedIds);
    const isTestUser = authUid.length === 0;
    return buildDatasetsLinkedList(customDatasets, deletedIds, isTestUser);
  }, [isLoading, authUid, rawDatasets, rawDeletedIds]);
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
  const isLoading = useDatasetsLoading();
  const authUid = useSyncExternalStore(
    subscribeCustomParameters,
    getAuthUidSnapshot,
    getAuthUidServerSnapshot,
  );
  const linkedList = useDatasetsLinkedList();
  return useMemo(() => {
    if (isLoading) return undefined;
    const found = linkedList.findNode((d) => d.id === id)?.value;
    if (found) return found;
    // Si es un usuario autenticado, no mostrar datasets mockup como respaldo
    return authUid.length > 0 ? undefined : fallbackDataset;
  }, [isLoading, authUid, linkedList, id, fallbackDataset]);
}
