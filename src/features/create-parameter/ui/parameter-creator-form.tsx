"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  getCustomParametersServerSnapshot,
  getCustomParametersSnapshot,
  mergeDatasetParameters,
  parseCustomParametersSnapshot,
  saveCustomDataset,
  saveCustomParameter,
  subscribeCustomParameters,
  useDatasetById,
  type Dataset,
  type DatasetParameter,
  type ParameterType,
} from "@/entities/dataset";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Alert } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  BoltIcon,
  BroomIcon,
  HashIcon,
  RefreshIcon,
  ShapesIcon,
  SlidersIcon,
  TableGridIcon,
  TrendChartIcon,
} from "@/shared/ui/icons";
import {
  DEFAULT_QUALITATIVE_PRESETS,
  INITIAL_QUALITATIVE_ROWS,
  INITIAL_QUANTITATIVE_ROWS,
  type QualitativePreset,
  type QualitativeRow,
  type QuantitativeRow,
} from "../model/presets";
import { QualitativeMatrixEditor } from "./qualitative-matrix-editor";
import { QuantitativeMatrixEditor } from "./quantitative-matrix-editor";

function buildInitialQuantRows(param?: DatasetParameter): QuantitativeRow[] {
  if (param && param.type === "quantitative") {
    return param.values.map((value, idx) => ({
      id: `q-edit-${idx}`,
      label: param.labels?.[idx] ?? `Muestra_Ensayo_A${idx + 1}`,
      value,
    }));
  }
  return INITIAL_QUANTITATIVE_ROWS;
}

function buildInitialQualRows(param?: DatasetParameter): QualitativeRow[] {
  if (param && param.type === "qualitative") {
    return param.values.map((category, idx) => ({
      id: `c-edit-${idx}`,
      label: param.labels?.[idx] ?? `CASE_#${8901 + idx}`,
      category,
    }));
  }
  return INITIAL_QUALITATIVE_ROWS;
}

function buildInitialPresets(param?: DatasetParameter): {
  presets: QualitativePreset[];
  activePresetId: string;
} {
  if (param && param.type === "qualitative") {
    const distinct = param.levels?.length
      ? param.levels
      : Array.from(new Set(param.values));
    const customPreset: QualitativePreset = {
      id: `preset-param-${param.id}`,
      name: param.name.slice(0, 16).toUpperCase(),
      levels: distinct,
    };
    return {
      presets: [customPreset, ...DEFAULT_QUALITATIVE_PRESETS],
      activePresetId: customPreset.id,
    };
  }
  return {
    presets: DEFAULT_QUALITATIVE_PRESETS,
    activePresetId: DEFAULT_QUALITATIVE_PRESETS[0].id,
  };
}

function ParameterEditorInner({
  mode,
  dataset,
  editingParameter,
}: {
  mode: "create-dataset" | "parameter";
  dataset?: Dataset;
  editingParameter?: DatasetParameter;
}) {
  const router = useRouter();
  const seqRef = useRef(100);
  const initialPresetState = buildInitialPresets(editingParameter);

  const [paramType, setParamType] = useState<ParameterType>(
    editingParameter?.type ?? "quantitative",
  );
  const [datasetName, setDatasetName] = useState<string>(
    dataset?.name ?? "Medición_Presión_Experimental_20",
  );
  const [parameterName, setParameterName] = useState<string>(
    editingParameter?.name ??
      (mode === "create-dataset" ? "Parametro_1" : "Nuevo_Parametro_1"),
  );
  const [quantRows, setQuantRows] = useState<QuantitativeRow[]>(() =>
    buildInitialQuantRows(editingParameter),
  );
  const [qualRows, setQualRows] = useState<QualitativeRow[]>(() =>
    buildInitialQualRows(editingParameter),
  );
  const [presets, setPresets] = useState<QualitativePreset[]>(
    initialPresetState.presets,
  );
  const [activePresetId, setActivePresetId] = useState<string>(
    initialPresetState.activePresetId,
  );
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    setError(null);
    seqRef.current += 1;
    if (paramType === "quantitative") {
      setQuantRows([
        { id: `q-clear-${seqRef.current}`, label: "Muestra_Ensayo_A1", value: 0 },
      ]);
    } else {
      const currentPreset =
        presets.find((p) => p.id === activePresetId) ?? presets[0];
      const defaultCategory = currentPreset?.levels[0] ?? "Nivel_1";
      setQualRows([
        {
          id: `c-clear-${seqRef.current}`,
          label: "CASE_#8901",
          category: defaultCategory,
        },
      ]);
    }
  }

  function handleSelectPreset(presetId: string) {
    setActivePresetId(presetId);
    const chosen = presets.find((p) => p.id === presetId);
    if (!chosen || chosen.levels.length === 0) return;

    setQualRows((prev) =>
      prev.map((row, idx) => ({
        ...row,
        category: chosen.levels.includes(row.category)
          ? row.category
          : chosen.levels[idx % chosen.levels.length],
      })),
    );
  }

  function handleAddLevelToActivePreset(newLevel: string) {
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === activePresetId && !preset.levels.includes(newLevel)
          ? { ...preset, levels: [...preset.levels, newLevel] }
          : preset,
      ),
    );
  }

  function handleCreateCustomPreset(customPreset: QualitativePreset) {
    setPresets((prev) => [...prev, customPreset]);
    setActivePresetId(customPreset.id);
    setQualRows((prev) =>
      prev.map((row, idx) => ({
        ...row,
        category: customPreset.levels[idx % customPreset.levels.length],
      })),
    );
  }

  function handleSaveAndCalculate() {
    setError(null);
    const cleanDatasetName = datasetName.trim().replace(/\s+/g, "_");
    const cleanParamName = parameterName.trim().replace(/\s+/g, "_");

    if (mode === "create-dataset" && !cleanDatasetName) {
      setError("Ingresa un identificador para el nuevo dataset.");
      return;
    }
    if (!cleanParamName) {
      setError("Ingresa un identificador para el parámetro antes de guardar.");
      return;
    }

    seqRef.current += 1;
    const targetParamId =
      editingParameter?.id ??
      `${cleanParamName.toLowerCase()}-${seqRef.current}`;

    let savedParam: DatasetParameter;

    if (paramType === "quantitative") {
      if (quantRows.length < 1) {
        setError("Agrega al menos 1 observación en la matriz cuantitativa.");
        return;
      }
      savedParam = {
        id: targetParamId,
        name: cleanParamName,
        type: "quantitative",
        scale:
          editingParameter?.type === "quantitative"
            ? editingParameter.scale
            : "Float64",
        unit:
          editingParameter?.type === "quantitative"
            ? editingParameter.unit
            : undefined,
        values: quantRows.map((r) => r.value),
        labels: quantRows.map((r) => r.label.trim() || "Muestra"),
      };
    } else {
      if (qualRows.length < 1) {
        setError("Agrega al menos 1 caso en la matriz cualitativa.");
        return;
      }
      const activePreset =
        presets.find((p) => p.id === activePresetId) ?? presets[0];

      savedParam = {
        id: targetParamId,
        name: cleanParamName,
        type: "qualitative",
        scale:
          editingParameter?.type === "qualitative"
            ? editingParameter.scale
            : "Ordinal",
        values: qualRows.map((r) => r.category),
        labels: qualRows.map((r) => r.label.trim() || "CASE"),
        levels: activePreset?.levels,
      };
    }

    if (mode === "create-dataset" || !dataset) {
      const slug = cleanDatasetName
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "-")
        .replace(/-+/g, "-");
      const newDatasetId = `${slug || "dataset"}-${seqRef.current}`;
      const obsCount = savedParam.values.length;

      const newDataset: Dataset = {
        id: newDatasetId,
        name: cleanDatasetName,
        fileName: cleanDatasetName.includes(".")
          ? cleanDatasetName
          : `${cleanDatasetName}.csv`,
        sidebarName:
          cleanDatasetName.length > 22
            ? `${cleanDatasetName.slice(0, 22)}...`
            : cleanDatasetName,
        repositoryLabel: "Laboratorio_Manual",
        description:
          "Dataset creado manualmente por el usuario en el editor interactivo de StatProb.",
        format: "CSV",
        createdLabel: "Creado ahora · Manual",
        kindLabel: "Manual Individual",
        kind: "individual",
        sampleSize: obsCount.toLocaleString("en-US"),
        variablesCount: 1,
        sizeLabel: `${Math.max(1, Math.round(obsCount * 0.4))} KB`,
        hasSecondaryAction: true,
        parameters: [savedParam],
      };

      saveCustomDataset(newDataset);
      router.push(ROUTES.main);
      return;
    }

    saveCustomParameter(dataset.id, savedParam);
    router.push(
      `${ROUTES.datasetDetail(dataset.id)}?param=${encodeURIComponent(savedParam.id)}`,
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Encabezado fiel al diseño según tipo Cuantitativo o Cualitativo */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          {paramType === "quantitative" ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Ingreso Manual &amp; Calibración de Datos
              </h1>
              <div className="mt-2">
                <Badge variant="success">Modo interactivo activo</Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted sm:text-sm">
                Estructura variables cuantitativas o categóricas y captura
                observaciones de forma individual o mediante distribuciones de
                frecuencias agrupadas con cálculo estocástico en vivo.
              </p>
            </>
          ) : (
            <>
              <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                <span
                  className="h-6 w-1 shrink-0 rounded-full bg-primary"
                  aria-hidden
                />
                Ingreso Manual: Variables Cualitativas
              </h1>
              <p className="mt-2 text-xs leading-5 text-muted sm:text-sm">
                Estructura variables categóricas nominales y ordinales, codifica
                niveles o factores y registra frecuencias y etiquetas con
                verificación modal en vivo.
              </p>
            </>
          )}
        </div>

        {/* Únicos 2 botones superiores de acción según el diseño */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-end">
          <Button
            variant="outline"
            size="md"
            onClick={handleClear}
            className="h-10 text-xs"
          >
            {paramType === "quantitative" ? (
              <>
                <BroomIcon className="size-4 text-muted" />
                Limpiar Matriz
              </>
            ) : (
              <>
                <RefreshIcon className="size-4 text-muted" />
                Limpiar Tabla / Factores
              </>
            )}
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSaveAndCalculate}
            className="h-10 text-xs font-semibold"
          >
            <BoltIcon className="size-4" />
            Guardar y Calcular Estadísticos
          </Button>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* Barra de control: Identificador de matriz/parámetro y Naturaleza de variable */}
      <Card className="flex flex-col gap-5 p-4 sm:p-5 lg:flex-row lg:items-center">
        {mode === "create-dataset" ? (
          <>
            <div className="flex flex-1 flex-col gap-1.5 lg:max-w-xs">
              <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                <label htmlFor="dataset-identifier-input" className="text-muted">
                  Identificador de matriz / dataset
                </label>
                <span className="font-semibold text-primary">NUEVO</span>
              </div>
              <div className="flex h-10 items-center gap-2.5 rounded-lg border border-border bg-background/80 px-3 focus-within:border-primary">
                <TableGridIcon className="size-4 shrink-0 text-muted" />
                <input
                  id="dataset-identifier-input"
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="w-full bg-transparent font-mono text-xs font-medium text-foreground outline-none"
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-1.5 lg:max-w-xs">
              <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                <label htmlFor="param-identifier-input" className="text-muted">
                  Nombre del parámetro inicial
                </label>
                <span className="font-semibold text-primary">VAR 01</span>
              </div>
              <div className="flex h-10 items-center gap-2.5 rounded-lg border border-border bg-background/80 px-3 focus-within:border-primary">
                <HashIcon className="size-3.5 shrink-0 text-muted" />
                <input
                  id="param-identifier-input"
                  type="text"
                  value={parameterName}
                  onChange={(e) => setParameterName(e.target.value)}
                  className="w-full bg-transparent font-mono text-xs font-medium text-foreground outline-none"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col gap-1.5 lg:max-w-md">
            <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
              <label htmlFor="matrix-identifier-input" className="text-muted">
                Parámetro en {dataset?.name ?? "Dataset"}
              </label>
              <span className="font-semibold text-primary">DS-ALPHA.09</span>
            </div>
            <div className="flex h-10 items-center gap-2.5 rounded-lg border border-border bg-background/80 px-3 focus-within:border-primary">
              <TableGridIcon className="size-4 shrink-0 text-muted" />
              <input
                id="matrix-identifier-input"
                type="text"
                value={parameterName}
                onChange={(e) => setParameterName(e.target.value)}
                className="w-full bg-transparent font-mono text-xs font-medium text-foreground outline-none"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            <SlidersIcon className="size-3.5 text-primary" />
            Naturaleza de variable
          </span>

          <div
            role="group"
            aria-label="Naturaleza de variable"
            className="inline-flex rounded-lg border border-border bg-background/80 p-1"
          >
            <button
              type="button"
              onClick={() => setParamType("qualitative")}
              aria-pressed={paramType === "qualitative"}
              className={cn(
                "flex items-center gap-2 rounded-md px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
                paramType === "qualitative"
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_-8px_var(--color-primary)]"
                  : "text-muted hover:text-foreground",
              )}
            >
              <ShapesIcon className="size-3.5" />
              Cualitativa (Categórica)
            </button>

            <button
              type="button"
              onClick={() => setParamType("quantitative")}
              aria-pressed={paramType === "quantitative"}
              className={cn(
                "flex items-center gap-2 rounded-md px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
                paramType === "quantitative"
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_-8px_var(--color-primary)]"
                  : "text-muted hover:text-foreground",
              )}
            >
              <TrendChartIcon className="size-3.5" />
              Cuantitativa
            </button>
          </div>
        </div>
      </Card>

      {/* Editor principal según la naturaleza de variable seleccionada */}
      {paramType === "quantitative" ? (
        <QuantitativeMatrixEditor
          parameterName={parameterName}
          rows={quantRows}
          onChangeRows={setQuantRows}
        />
      ) : (
        <QualitativeMatrixEditor
          parameterName={parameterName}
          rows={qualRows}
          presets={presets}
          activePresetId={activePresetId}
          onChangeRows={setQualRows}
          onSelectPreset={handleSelectPreset}
          onAddLevelToActivePreset={handleAddLevelToActivePreset}
          onCreateCustomPreset={handleCreateCustomPreset}
        />
      )}
    </div>
  );
}

export function ParameterCreatorForm({
  datasetId,
  initialDataset,
  mode = "parameter",
}: {
  datasetId?: string;
  initialDataset?: Dataset;
  mode?: "create-dataset" | "parameter";
}) {
  const searchParams = useSearchParams();
  const editParamId = searchParams.get("edit");

  const resolvedDataset = useDatasetById(datasetId ?? "", initialDataset);

  const customRaw = useSyncExternalStore(
    subscribeCustomParameters,
    () =>
      resolvedDataset
        ? getCustomParametersSnapshot(resolvedDataset.id)
        : "[]",
    getCustomParametersServerSnapshot,
  );

  const customParameters = useMemo(
    () => parseCustomParametersSnapshot(customRaw),
    [customRaw],
  );

  const allParameters = useMemo(
    () =>
      resolvedDataset
        ? mergeDatasetParameters(resolvedDataset.parameters, customParameters)
        : [],
    [resolvedDataset, customParameters],
  );

  const editingParameter = useMemo(
    () =>
      editParamId
        ? allParameters.find((param) => param.id === editParamId)
        : undefined,
    [allParameters, editParamId],
  );

  return (
    <ParameterEditorInner
      key={`${mode}-${resolvedDataset?.id ?? "new"}-${editingParameter?.id ?? "new"}`}
      mode={mode}
      dataset={resolvedDataset}
      editingParameter={editingParameter}
    />
  );
}
