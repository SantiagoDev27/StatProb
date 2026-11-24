"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DatasetCard,
  deleteDatasetById,
  redoDatasetsChange,
  undoDatasetsChange,
  useDatasetsLinkedList,
  useDatasetsLoading,
  useDatasetsUndoRedo,
  type Dataset,
} from "@/entities/dataset";
import {
  setDatasetSearchQuery,
  useDatasetSearchQuery,
  useDatasetTrieSearch,
} from "@/features/search-datasets";
import { cn, DoublyLinkedList } from "@/shared/lib";
import { ROUTES } from "@/shared/config";
import { Badge } from "@/shared/ui/badge";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  FolderChartIcon,
} from "@/shared/ui/icons";

type DatasetFilter = "all" | "individual" | "grouped" | "recent";

export function DatasetsGrid() {
  // 1. Obtenemos la Lista Doblemente Enlazada (DoublyLinkedList<Dataset>) principal
  const isLoadingDatasets = useDatasetsLoading();
  const datasetsLinkedList = useDatasetsLinkedList();
  const { canUndo, canRedo, undoCount, redoCount } = useDatasetsUndoRedo();
  const allDatasets = useMemo(
    () => datasetsLinkedList.toArray(),
    [datasetsLinkedList],
  );

  // Atajos de teclado Ctrl+Z (Deshacer borrado/cambio de dataset) y Ctrl+Y / Ctrl+Shift+Z (Rehacer)
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const isCtrlOrMeta = event.ctrlKey || event.metaKey;
      if (!isCtrlOrMeta) return;

      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        if (undoDatasetsChange()) {
          event.preventDefault();
        }
      } else if (key === "y" || (key === "z" && event.shiftKey)) {
        if (redoDatasetsChange()) {
          event.preventDefault();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 2. Aplicamos búsqueda por prefijo con el Trie sobre los datasets de la lista
  const searchQuery = useDatasetSearchQuery();
  const trieMatchedDatasets = useDatasetTrieSearch(allDatasets, searchQuery);
  const [activeFilter, setActiveFilter] = useState<DatasetFilter>("all");

  const filterTabs: Array<{ id: DatasetFilter; label: string }> = [
    { id: "all", label: `Todos (${trieMatchedDatasets.length})` },
    { id: "individual", label: "Datos Individuales" },
    { id: "grouped", label: "Datos Agrupados" },
    { id: "recent", label: "Recientes" },
  ];

  // 3. Recorremos la Lista Doblemente Enlazada nodo por nodo (head -> next -> tail)
  //    para construir la sublista visible según la pestaña activa
  const filteredLinkedList = useMemo(() => {
    const matchedIds = new Set(trieMatchedDatasets.map((d) => d.id));
    const list = new DoublyLinkedList<Dataset>();

    let currentNode = datasetsLinkedList.head;
    while (currentNode) {
      const dataset = currentNode.value;
      if (matchedIds.has(dataset.id)) {
        if (activeFilter === "all") {
          list.append(dataset);
        } else if (
          activeFilter === "individual" &&
          dataset.kind === "individual"
        ) {
          list.append(dataset);
        } else if (activeFilter === "grouped" && dataset.kind === "grouped") {
          list.append(dataset);
        } else if (activeFilter === "recent" && list.size < 4) {
          list.append(dataset);
        }
      }
      currentNode = currentNode.next;
    }

    return list;
  }, [datasetsLinkedList, trieMatchedDatasets, activeFilter]);

  const filteredDatasets = useMemo(
    () => filteredLinkedList.toArray(),
    [filteredLinkedList],
  );

  function handleDeleteDataset(datasetId: string) {
    deleteDatasetById(datasetId);
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-5 xl:flex-row xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <FolderChartIcon className="size-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              Datasets Creados por el Usuario
            </h2>
            <Badge>{filteredDatasets.length} en total</Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            Accede directamente a la ficha detallada, análisis estadístico o edita los
            datos existentes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          {/* Controles Deshacer / Rehacer basados en Pila (Stack) */}
          <div
            role="group"
            aria-label="Deshacer o rehacer cambios en datasets"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/70 p-1"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => undoDatasetsChange()}
              disabled={!canUndo}
              title="Deshacer eliminación o cambio (Ctrl + Z)"
              aria-label="Deshacer eliminación o cambio (Ctrl + Z)"
              className="h-7 px-2.5 text-xs"
            >
              <ArrowLeftIcon className="size-3.5" />
              <span>Deshacer</span>
              <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] text-primary">
                {undoCount}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => redoDatasetsChange()}
              disabled={!canRedo}
              title="Rehacer cambio (Ctrl + Y)"
              aria-label="Rehacer cambio (Ctrl + Y)"
              className="h-7 px-2.5 text-xs"
            >
              <span>Rehacer</span>
              <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted">
                {redoCount}
              </span>
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </div>

          <div
            role="tablist"
            aria-label="Filtrar datasets"
            className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background/70 p-1"
          >
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(tab.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-surface-hover text-foreground shadow-xs"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isLoadingDatasets ? (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="h-52 animate-pulse rounded-xl border border-border bg-background/50 p-4"
            />
          ))}
        </div>
      ) : filteredDatasets.length === 0 ? (
        <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/40 py-10 text-center">
          {searchQuery.trim().length > 0 ? (
            <>
              <p className="text-sm font-medium text-foreground">
                No se encontraron datasets que coincidan con{" "}
                <span className="font-mono text-primary">
                  &ldquo;{searchQuery}&rdquo;
                </span>
              </p>
              <p className="text-xs text-muted">
                El árbol de prefijos (Trie) no halló coincidencias para ese término.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDatasetSearchQuery("")}
                className="mt-1 text-xs"
              >
                Limpiar búsqueda
              </Button>
            </>
          ) : allDatasets.length === 0 ? (
            <>
              <p className="text-sm font-medium text-foreground">
                Aún no has creado ningún dataset
              </p>
              <p className="max-w-md text-xs text-muted">
                Tus datasets se guardan automáticamente en tu cuenta en tiempo real.
                Crea tu primer dataset individual para comenzar a analizar datos.
              </p>
              <ButtonLink
                href={ROUTES.datasetCreate}
                size="sm"
                className="mt-1 text-xs font-semibold"
              >
                Crear Dataset Individual
              </ButtonLink>
            </>
          ) : (
            <p className="text-sm font-medium text-muted">
              No hay datasets en esta categoría todavía.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDatasets.map((dataset) => (
            <DatasetCard
              key={dataset.id}
              dataset={dataset}
              onDelete={handleDeleteDataset}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
