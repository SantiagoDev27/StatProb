"use client";

import { useMemo, useState } from "react";
import {
  DatasetCard,
  deleteDatasetById,
  useDatasetsLinkedList,
  type Dataset,
} from "@/entities/dataset";
import {
  setDatasetSearchQuery,
  useDatasetSearchQuery,
  useDatasetTrieSearch,
} from "@/features/search-datasets";
import { cn, DoublyLinkedList } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { FolderChartIcon } from "@/shared/ui/icons";

type DatasetFilter = "all" | "individual" | "grouped" | "recent";

export function DatasetsGrid() {
  // 1. Obtenemos la Lista Doblemente Enlazada (DoublyLinkedList<Dataset>) principal
  const datasetsLinkedList = useDatasetsLinkedList();
  const allDatasets = useMemo(
    () => datasetsLinkedList.toArray(),
    [datasetsLinkedList],
  );

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

        <div
          role="tablist"
          aria-label="Filtrar datasets"
          className="inline-flex flex-wrap items-center gap-1 self-start rounded-lg border border-border bg-background/70 p-1"
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

      {filteredDatasets.length === 0 ? (
        <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/40 py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            No se encontraron datasets que coincidan con{" "}
            <span className="font-mono text-primary">
              &ldquo;{searchQuery}&rdquo;
            </span>
          </p>
          <p className="text-xs text-muted">
            El árbol de prefijos (Trie) no halló coincidencias para ese término.
          </p>
          {searchQuery.trim().length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDatasetSearchQuery("")}
              className="mt-1 text-xs"
            >
              Limpiar búsqueda
            </Button>
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
