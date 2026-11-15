"use client";

import { useMemo, useState } from "react";
import { DatasetCard, useAllDatasets } from "@/entities/dataset";
import {
  setDatasetSearchQuery,
  useDatasetSearchQuery,
  useDatasetTrieSearch,
} from "@/features/search-datasets";
import { cn } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { FolderChartIcon } from "@/shared/ui/icons";

type DatasetFilter = "all" | "individual" | "grouped" | "recent";

export function DatasetsGrid() {
  const allDatasets = useAllDatasets();
  const searchQuery = useDatasetSearchQuery();
  const trieMatchedDatasets = useDatasetTrieSearch(allDatasets, searchQuery);
  const [activeFilter, setActiveFilter] = useState<DatasetFilter>("all");

  const filterTabs: Array<{ id: DatasetFilter; label: string }> = [
    { id: "all", label: `Todos (${trieMatchedDatasets.length})` },
    { id: "individual", label: "Datos Individuales" },
    { id: "grouped", label: "Datos Agrupados" },
    { id: "recent", label: "Recientes" },
  ];

  const filteredDatasets = useMemo(() => {
    if (activeFilter === "individual") {
      return trieMatchedDatasets.filter(
        (dataset) => dataset.kind === "individual",
      );
    }
    if (activeFilter === "grouped") {
      return trieMatchedDatasets.filter(
        (dataset) => dataset.kind === "grouped",
      );
    }
    if (activeFilter === "recent") {
      return trieMatchedDatasets.slice(0, 4);
    }
    return trieMatchedDatasets;
  }, [trieMatchedDatasets, activeFilter]);

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
            <DatasetCard key={dataset.id} dataset={dataset} />
          ))}
        </div>
      )}
    </Card>
  );
}
