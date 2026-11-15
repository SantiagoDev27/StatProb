"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Dataset } from "@/entities/dataset";
import { Trie } from "@/shared/lib";

/**
 * Construye un `Trie<Dataset>` indexando exclusivamente los datasets disponibles.
 *
 * Por cada `Dataset`, se insertan en el Árbol de Prefijos (`Trie`) los tokens de:
 *   - `dataset.name` (ej. `"Muestreo_Biometrico_"`)
 *   - `dataset.fileName` (ej. `"Muestreo_Biometrico_N1240.xlsx"`)
 *   - `dataset.format` (ej. `"XLSX"`, `"CSV"`)
 *   - `dataset.kindLabel` (ej. `"Manual Individual"`, `"Manual Agrupado"`)
 *
 * De esta manera, cualquier búsqueda por prefijo consulta únicamente datasets
 * en tiempo O(M + K) mediante el Trie.
 */
export function buildDatasetTrie(datasets: readonly Dataset[]): Trie<Dataset> {
  const trie = new Trie<Dataset>();
  for (const dataset of datasets) {
    trie.insertDocument(
      [dataset.name, dataset.fileName, dataset.format, dataset.kindLabel],
      dataset,
    );
  }
  return trie;
}

/**
 * Estado reactivo compartido para el texto de la barra de búsqueda de datasets,
 * permitiendo que la barra del header filtre en vivo el grid de `/main` y muestre
 * resultados desplegables desde cualquier ruta de la aplicación.
 */
let currentSearchQuery = "";
const listeners = new Set<() => void>();

export function setDatasetSearchQuery(nextQuery: string): void {
  if (currentSearchQuery === nextQuery) return;
  currentSearchQuery = nextQuery;
  for (const listener of listeners) {
    listener();
  }
}

function subscribeSearchQuery(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSearchQuerySnapshot(): string {
  return currentSearchQuery;
}

function getSearchQueryServerSnapshot(): string {
  return "";
}

export function useDatasetSearchQuery(): string {
  return useSyncExternalStore(
    subscribeSearchQuery,
    getSearchQuerySnapshot,
    getSearchQueryServerSnapshot,
  );
}

/**
 * Hook que memoriza la instancia `Trie<Dataset>` cuando cambia la colección
 * de datasets y ejecuta la búsqueda por prefijo en el Trie para el `query` dado.
 */
export function useDatasetTrieSearch(
  datasets: readonly Dataset[],
  query: string,
): Dataset[] {
  const datasetTrie = useMemo(() => buildDatasetTrie(datasets), [datasets]);

  return useMemo(() => {
    if (!query.trim()) {
      return Array.from(datasets);
    }
    return datasetTrie.search(query);
  }, [datasetTrie, datasets, query]);
}

