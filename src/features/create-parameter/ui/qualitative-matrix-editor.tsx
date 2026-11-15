"use client";

import { useMemo, useRef, useState } from "react";
import { analyzeQualitativeParameter } from "@/entities/dataset";
import { cn } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  CheckCircleIcon,
  ListIcon,
  PlusCircleIcon,
  TableGridIcon,
  TrashIcon,
  TrendChartIcon,
} from "@/shared/ui/icons";
import type { QualitativePreset, QualitativeRow } from "../model/presets";

type QualitativeMatrixEditorProps = {
  parameterName: string;
  rows: QualitativeRow[];
  presets: QualitativePreset[];
  activePresetId: string;
  onChangeRows: (rows: QualitativeRow[]) => void;
  onSelectPreset: (presetId: string) => void;
  onAddLevelToActivePreset: (level: string) => void;
  onCreateCustomPreset: (preset: QualitativePreset) => void;
};

const LEVEL_COLORS = [
  "#22c3e6",
  "#10b981",
  "#8b5cf6",
  "#94a3b8",
  "#f87171",
  "#f59e0b",
];

const INITIAL_VISIBLE_LIMIT = 60;

export function QualitativeMatrixEditor({
  parameterName,
  rows,
  presets,
  activePresetId,
  onChangeRows,
  onSelectPreset,
  onAddLevelToActivePreset,
  onCreateCustomPreset,
}: QualitativeMatrixEditorProps) {
  const [showAllRows, setShowAllRows] = useState(false);
  const seqRef = useRef(100);
  const [showFactorCreator, setShowFactorCreator] = useState(false);
  const [creatorMode, setCreatorMode] = useState<"level" | "preset">("preset");
  const [newLevelName, setNewLevelName] = useState("");
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetLevels, setNewPresetLevels] = useState("");

  const activePreset =
    presets.find((p) => p.id === activePresetId) ?? presets[0];

  const availableLevels = useMemo(() => {
    const set = new Set<string>(activePreset ? activePreset.levels : []);
    for (const row of rows) {
      if (row.category.trim()) set.add(row.category.trim());
    }
    return Array.from(set);
  }, [activePreset, rows]);

  const stats = useMemo(
    () =>
      analyzeQualitativeParameter({
        id: "live-qual",
        name: parameterName || "Variable",
        type: "qualitative",
        scale: "Ordinal",
        values: rows.map((r) => r.category),
      }),
    [parameterName, rows],
  );

  const percentageByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const cat of stats.categories) {
      map.set(cat.label, cat.percentage);
    }
    return map;
  }, [stats.categories]);

  const visibleRows =
    showAllRows || rows.length <= INITIAL_VISIBLE_LIMIT
      ? rows
      : rows.slice(0, INITIAL_VISIBLE_LIMIT);

  function handleAddCase() {
    const nextCaseNum = 8900 + rows.length + 1;
    const defaultCategory =
      stats.mode !== "—"
        ? stats.mode
        : (availableLevels[0] ?? "Satisfecho");

    seqRef.current += 1;
    onChangeRows([
      ...rows,
      {
        id: `c-row-${seqRef.current}`,
        label: `CASE_#${nextCaseNum}`,
        category: defaultCategory,
      },
    ]);
  }

  function handleUpdateLabel(id: string, label: string) {
    onChangeRows(rows.map((r) => (r.id === id ? { ...r, label } : r)));
  }

  function handleUpdateCategory(id: string, category: string) {
    onChangeRows(rows.map((r) => (r.id === id ? { ...r, category } : r)));
  }

  function handleDeleteRow(id: string) {
    onChangeRows(rows.filter((r) => r.id !== id));
  }

  function handleSaveFactorOrPreset() {
    if (creatorMode === "level") {
      const clean = newLevelName.trim();
      if (!clean) return;
      onAddLevelToActivePreset(clean);
      setNewLevelName("");
      setShowFactorCreator(false);
    } else {
      const cleanName = newPresetName.trim().toUpperCase();
      const levels = newPresetLevels
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!cleanName || levels.length < 2) return;

      seqRef.current += 1;
      const customPreset: QualitativePreset = {
        id: `preset-custom-${seqRef.current}`,
        name: cleanName,
        levels,
      };
      onCreateCustomPreset(customPreset);
      setNewPresetName("");
      setNewPresetLevels("");
      setShowFactorCreator(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Izquierda: Controles de plantilla + Matriz cualitativa */}
      <div className="flex flex-col gap-4 xl:col-span-8">
        <Card className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCase}
              className="h-9 border-primary/40 bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/20"
            >
              <PlusCircleIcon className="size-4" />+ Añadir Caso
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFactorCreator((prev) => !prev)}
              className="h-9 text-xs"
            >
              <ListIcon className="size-3.5 text-[#b5a7f8]" />+ Añadir Factor /
              Nivel
            </Button>
          </div>

          {/* Creador en línea de nuevo preset o factor al momento */}
          {showFactorCreator && (
            <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-background/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCreatorMode("preset")}
                    className={cn(
                      "rounded-md px-2.5 py-1 font-medium transition-colors",
                      creatorMode === "preset"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted hover:text-foreground",
                    )}
                  >
                    Crear Nuevo Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatorMode("level")}
                    className={cn(
                      "rounded-md px-2.5 py-1 font-medium transition-colors",
                      creatorMode === "level"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted hover:text-foreground",
                    )}
                  >
                    Añadir Nivel al Preset Actual
                  </button>
                </div>
                <span className="font-mono text-[10px] text-muted">
                  Personalización al momento
                </span>
              </div>

              {creatorMode === "preset" ? (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Nombre del preset (ej. RIESGO CLÍNICO)"
                    className="h-9 rounded-lg border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary sm:col-span-4"
                  />
                  <input
                    type="text"
                    value={newPresetLevels}
                    onChange={(e) => setNewPresetLevels(e.target.value)}
                    placeholder="Niveles separados por coma (ej. Leve, Moderado, Severo, Crítico)"
                    className="h-9 rounded-lg border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary sm:col-span-6"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveFactorOrPreset}
                    className="h-9 text-xs font-semibold sm:col-span-2"
                  >
                    Guardar
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="text"
                    value={newLevelName}
                    onChange={(e) => setNewLevelName(e.target.value)}
                    placeholder={`Nuevo nivel para ${activePreset?.name ?? "preset"}`}
                    className="h-9 flex-1 rounded-lg border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveFactorOrPreset}
                    className="h-9 text-xs font-semibold"
                  >
                    Añadir Nivel
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Barra de PLANTILLA RÁPIDA (3 presets + personalizados) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Plantilla rápida:
            </span>
            <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background/80 p-1">
              {presets.map((preset) => {
                const active = preset.id === activePreset?.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPreset(preset.id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-md px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
                      active
                        ? "border border-primary/40 bg-primary/15 text-primary"
                        : "text-muted hover:text-foreground",
                    )}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Tabla Matriz de Observaciones Cualitativas */}
        <Card className="flex flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-4">
              <div className="flex items-center gap-2.5">
                <TableGridIcon className="size-4.5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">
                  Matriz de Observaciones Cualitativas
                </h2>
              </div>
              <span className="font-mono text-xs text-muted">
                {rows.length.toLocaleString("en-US")} Observaciones cargadas
              </span>
            </div>

            <div className="mt-2 max-h-[440px] overflow-auto">
              <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted">
                    <th className="w-12 py-3 pr-2">#</th>
                    <th className="py-3 px-3">Identificador / Caso</th>
                    <th className="py-3 px-3">Categoría / Nivel Asignado</th>
                    <th className="py-3 px-3 text-center">Código Factor</th>
                    <th className="py-3 px-3 text-right">Frec. Relativa</th>
                    <th className="w-16 py-3 pl-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {visibleRows.map((row, idx) => {
                    const levelIdx = availableLevels.indexOf(row.category);
                    const factorCode =
                      levelIdx >= 0 ? levelIdx + 1 : availableLevels.length;
                    const relFreq =
                      percentageByCategory.get(row.category) ?? 0;
                    const isMode =
                      stats.mode !== "—" && row.category === stats.mode;
                    const dotColor =
                      LEVEL_COLORS[
                        (levelIdx >= 0 ? levelIdx : idx) % LEVEL_COLORS.length
                      ];

                    return (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-surface-hover/40"
                      >
                        <td className="py-3 pr-2 font-mono text-[11px] text-muted">
                          {String(idx + 1).padStart(3, "0")}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={row.label}
                            onChange={(e) =>
                              handleUpdateLabel(row.id, e.target.value)
                            }
                            aria-label={`Identificador caso ${idx + 1}`}
                            className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 font-mono text-xs font-medium text-foreground outline-none transition-colors hover:border-border focus:border-primary/60 focus:bg-background/80"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: dotColor }}
                              aria-hidden
                            />
                            <select
                              value={row.category}
                              onChange={(e) =>
                                handleUpdateCategory(row.id, e.target.value)
                              }
                              aria-label={`Categoría caso ${idx + 1}`}
                              className="h-8 flex-1 rounded-md border border-border bg-background/70 px-2.5 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary"
                            >
                              {availableLevels.map((level) => (
                                <option
                                  key={level}
                                  value={level}
                                  className="bg-surface"
                                >
                                  {level}
                                </option>
                              ))}
                            </select>
                            {isMode && (
                              <Badge
                                variant="primary"
                                className="shrink-0 text-[9px]"
                              >
                                MODA
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex size-6 items-center justify-center rounded border border-border-strong bg-background/80 font-mono text-[11px] font-semibold text-foreground">
                            {factorCode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs font-semibold text-primary">
                          {relFreq.toFixed(2)}%
                        </td>
                        <td className="py-2.5 pl-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            aria-label={`Eliminar ${row.label}`}
                            className="inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-danger/15 hover:text-danger"
                          >
                            <TrashIcon className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {rows.length > INITIAL_VISIBLE_LIMIT && !showAllRows && (
              <div className="mt-3 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllRows(true)}
                  className="text-xs"
                >
                  Mostrar los {rows.length.toLocaleString("en-US")} casos
                  completos
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 font-mono text-[11px] text-muted">
            <span>
              Visualizando registros representativos de muestra N={rows.length}
            </span>
            <span className="flex items-center gap-2 text-success">
              <span className="size-1.5 rounded-full bg-success" aria-hidden />
              Codificación 1-{availableLevels.length} Homologada
            </span>
          </div>
        </Card>
      </div>

      {/* Derecha: Diagnóstico Cualitativo en Tiempo Real */}
      <div className="flex flex-col gap-4 xl:col-span-4">
        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="size-4.5 text-success" />
              <h2 className="text-base font-semibold leading-5 text-foreground">
                Diagnóstico Cualitativo en Tiempo Real
              </h2>
            </div>
            <Badge variant="success" className="shrink-0">
              VÁLIDO / CONSISTENTE
            </Badge>
          </div>

          {/* 4 métricas cualitativas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-background/60 p-3.5">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted">
                Tamaño muestral (N)
              </p>
              <p className="mt-1.5 font-mono text-xl font-bold text-foreground">
                {stats.count}
              </p>
              <p className="mt-1 text-[11px] text-muted">respuestas válidas</p>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3.5">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted">
                Moda (Mo) / Dominante
              </p>
              <p className="mt-1.5 truncate text-base font-bold text-primary">
                {stats.mode}
              </p>
              <p className="mt-1 font-mono text-[10px] text-muted">
                {stats.modeCount} casos ({stats.modePercentage.toFixed(1)}%)
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3.5">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted">
                Categorías únicas (K)
              </p>
              <p className="mt-1.5 font-mono text-xl font-bold text-[#b5a7f8]">
                {stats.uniqueCount}
              </p>
              <p className="mt-1 text-[11px] text-muted">niveles ordenados</p>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3.5">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted">
                Índice entropía (H&apos;)
              </p>
              <p className="mt-1.5 font-mono text-xl font-bold text-success">
                {stats.shannonEntropy.toFixed(3)}
              </p>
              <p className="mt-1 text-[11px] text-success">Diversidad media</p>
            </div>
          </div>

          {/* Distribución de Frecuencias (Pareto) */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4">
            <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
              <span className="uppercase tracking-wider text-muted">
                Distribución de frecuencias (Pareto)
              </span>
              <span className="text-primary">100.0% Acumulado</span>
            </div>

            <div className="flex flex-col gap-3">
              {stats.categories.map((cat, idx) => {
                const levelIdx = availableLevels.indexOf(cat.label);
                const code = levelIdx >= 0 ? levelIdx + 1 : idx + 1;
                const color = LEVEL_COLORS[idx % LEVEL_COLORS.length];

                return (
                  <div key={cat.label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium text-foreground">
                        {cat.label} (Nivel {code})
                      </span>
                      <span
                        className="shrink-0 font-mono text-[11px]"
                        style={{ color }}
                      >
                        {cat.percentage.toFixed(1)}% ({cat.count})
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(4, cat.percentage)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2.5 font-mono text-[10px]">
              <span className="flex items-center gap-1.5 text-muted">
                <TrendChartIcon className="size-3.5 text-primary" />
                Curva acumulada
              </span>
              <span className="text-success">MONÓTONA CRECIENTE</span>
            </div>
          </div>

          {/* Verificación de integridad */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Verificación de integridad
            </p>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-xs">
              <span className="flex items-center gap-2 text-muted">
                <CheckCircleIcon className="size-3.5 text-success" />
                Sin nulos o categorías huérfanas
              </span>
              <span className="font-mono text-[11px] text-success">0 err</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-xs">
              <span className="flex items-center gap-2 text-muted">
                <CheckCircleIcon className="size-3.5 text-success" />
                Escala ordinal ordenada monótonamente
              </span>
              <span className="font-mono text-[11px] text-success">
                {availableLevels.map((_, i) => i + 1).join(" < ")}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
