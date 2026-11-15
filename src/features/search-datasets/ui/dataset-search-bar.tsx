"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAllDatasets, type Dataset } from "@/entities/dataset";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { FileTableIcon, SearchIcon } from "@/shared/ui/icons";
import {
  setDatasetSearchQuery,
  useDatasetSearchQuery,
  useDatasetTrieSearch,
} from "../model/dataset-search-trie";

export function DatasetSearchBar() {
  const router = useRouter();
  const allDatasets = useAllDatasets();
  const query = useDatasetSearchQuery();
  const matchedDatasets = useDatasetTrieSearch(allDatasets, query);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleSelectDataset(dataset: Dataset) {
    setIsOpen(false);
    router.push(ROUTES.datasetDetail(dataset.id));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "Enter")) {
      setIsOpen(true);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (matchedDatasets.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % matchedDatasets.length);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (matchedDatasets.length > 0) {
        setHighlightedIndex(
          (prev) =>
            (prev - 1 + matchedDatasets.length) % matchedDatasets.length,
        );
      }
    } else if (event.key === "Enter" && query.trim().length > 0) {
      event.preventDefault();
      const chosen = matchedDatasets[highlightedIndex] ?? matchedDatasets[0];
      if (chosen) {
        handleSelectDataset(chosen);
      }
    }
  }

  const safeHighlight =
    matchedDatasets.length > 0
      ? Math.min(highlightedIndex, matchedDatasets.length - 1)
      : 0;

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <div
        className={cn(
          "flex h-9 w-56 items-center gap-2 rounded-lg border bg-surface px-3 transition-colors md:w-64",
          isOpen ? "border-primary ring-2 ring-primary/20" : "border-border",
        )}
      >
        <SearchIcon className="size-3.5 shrink-0 text-muted" />
        <input
          type="search"
          role="combobox"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setDatasetSearchQuery(e.target.value);
            setHighlightedIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar datasets..."
          aria-label="Buscar datasets"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="trie-dataset-search-results"
          className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted/70"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setDatasetSearchQuery("");
              setHighlightedIndex(0);
            }}
            aria-label="Limpiar búsqueda"
            className="font-mono text-xs text-muted hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div
          id="trie-dataset-search-results"
          role="listbox"
          aria-label="Datasets encontrados mediante Trie"
          className="absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border-strong bg-[#0a0f1a] shadow-2xl sm:left-0 sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-border/60 bg-surface/70 px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-muted">
            <span>
              {query.trim()
                ? `Resultados en Trie (${matchedDatasets.length})`
                : `Datasets disponibles (${matchedDatasets.length})`}
            </span>
            <span className="text-primary">Trie O(M)</span>
          </div>

          {matchedDatasets.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted">
              No se encontró ningún dataset con el prefijo{" "}
              <span className="font-mono font-semibold text-foreground">
                &ldquo;{query}&rdquo;
              </span>
              .
            </div>
          ) : (
            <ul className="max-h-72 divide-y divide-border/40 overflow-y-auto p-1.5">
              {matchedDatasets.map((dataset, idx) => {
                const isHighlighted = idx === safeHighlight;
                return (
                  <li key={dataset.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isHighlighted}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => handleSelectDataset(dataset)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        isHighlighted
                          ? "bg-primary/15 text-foreground"
                          : "text-muted hover:bg-surface-hover hover:text-foreground",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-primary">
                          <FileTableIcon className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {dataset.name}
                          </p>
                          <p className="truncate font-mono text-[10px] text-muted">
                            {dataset.fileName} · N = {dataset.sampleSize}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={
                          dataset.format === "XLSX" ? "success" : "primary"
                        }
                        className="shrink-0 text-[9px]"
                      >
                        {dataset.format}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
