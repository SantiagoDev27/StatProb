"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
  analyzeQualitativeParameter,
  analyzeQuantitativeParameter,
  saveCustomParameter,
  type Dataset,
  type DatasetParameter,
  type ParameterType,
  type QualitativeScale,
  type QuantitativeScale,
} from "@/entities/dataset";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Alert } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BarChartIcon,
  CheckCircleIcon,
  HashIcon,
  PieChartIcon,
  PlusCircleIcon,
} from "@/shared/ui/icons";
import { InputField } from "@/shared/ui/input-field";

const SAMPLE_QUANTITATIVE = {
  name: "Temperatura_Corporal_C",
  unit: "°C",
  raw: "36.4, 36.7, 36.8, 37.1, 36.5, 36.9, 37.2, 36.6, 36.8, 37.0, 36.3, 36.7, 37.4, 36.9, 36.8, 36.5, 37.1, 36.6, 38.2, 36.7, 36.8, 36.9, 37.0, 36.4, 36.6, 36.8, 37.3, 36.7, 35.9, 36.8",
};

const SAMPLE_QUALITATIVE = {
  name: "Diagnostico_Clinico",
  raw: "Óptimo, Estable, Estable, Observación, Óptimo, Estable, Crítico, Estable, Óptimo, Observación, Estable, Óptimo, Estable, Estable, Observación, Óptimo, Crítico, Estable, Óptimo, Estable",
};

function parseNumericTokens(raw: string): { values: number[]; invalid: string[] } {
  const tokens = raw
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const values: number[] = [];
  const invalid: string[] = [];

  for (const token of tokens) {
    const parsed = Number(token);
    if (Number.isFinite(parsed)) {
      values.push(parsed);
    } else {
      invalid.push(token);
    }
  }

  return { values, invalid };
}

function parseCategoricalTokens(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function ParameterCreatorForm({ dataset }: { dataset: Dataset }) {
  const router = useRouter();
  const [paramType, setParamType] = useState<ParameterType>("quantitative");
  const [name, setName] = useState("");
  const [quantScale, setQuantScale] = useState<QuantitativeScale>("Float64");
  const [qualScale, setQualScale] = useState<QualitativeScale>("Nominal");
  const [unit, setUnit] = useState("");
  const [rawValues, setRawValues] = useState("");
  const [error, setError] = useState<string | null>(null);

  const quantParsed = useMemo(
    () => (paramType === "quantitative" ? parseNumericTokens(rawValues) : null),
    [paramType, rawValues],
  );

  const qualParsed = useMemo(
    () => (paramType === "qualitative" ? parseCategoricalTokens(rawValues) : null),
    [paramType, rawValues],
  );

  const quantPreview = useMemo(() => {
    if (!quantParsed || quantParsed.values.length === 0) return null;
    return analyzeQuantitativeParameter({
      id: "preview",
      name: name || "preview",
      type: "quantitative",
      scale: quantScale,
      unit: unit || undefined,
      values: quantParsed.values,
    });
  }, [quantParsed, name, quantScale, unit]);

  const qualPreview = useMemo(() => {
    if (!qualParsed || qualParsed.length === 0) return null;
    return analyzeQualitativeParameter({
      id: "preview",
      name: name || "preview",
      type: "qualitative",
      scale: qualScale,
      values: qualParsed,
    });
  }, [qualParsed, name, qualScale]);

  function handleTypeSwitch(nextType: ParameterType) {
    setParamType(nextType);
    setError(null);
    setRawValues("");
  }

  function handleLoadSample() {
    setError(null);
    if (paramType === "quantitative") {
      setName(SAMPLE_QUANTITATIVE.name);
      setUnit(SAMPLE_QUANTITATIVE.unit);
      setQuantScale("Float64");
      setRawValues(SAMPLE_QUANTITATIVE.raw);
    } else {
      setName(SAMPLE_QUALITATIVE.name);
      setQualScale("Nominal");
      setRawValues(SAMPLE_QUALITATIVE.raw);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, "_");
    if (!cleanName) {
      setError("Asigna un nombre al parámetro antes de crearlo.");
      return;
    }

    let newParam: DatasetParameter;

    if (paramType === "quantitative") {
      const parsed = quantParsed ?? parseNumericTokens(rawValues);
      if (parsed.invalid.length > 0) {
        setError(
          `Se encontraron valores no numéricos: ${parsed.invalid.slice(0, 4).join(", ")}.`,
        );
        return;
      }
      if (parsed.values.length < 3) {
        setError("Ingresa al menos 3 valores numéricos para generar el diagnóstico.");
        return;
      }

      const normalizedValues =
        quantScale === "Int32"
          ? parsed.values.map((v) => Math.round(v))
          : parsed.values;

      newParam = {
        id: `custom-${Date.now()}`,
        name: cleanName,
        type: "quantitative",
        scale: quantScale,
        unit: unit.trim() || undefined,
        values: normalizedValues,
      };
    } else {
      const categories = qualParsed ?? parseCategoricalTokens(rawValues);
      if (categories.length < 3) {
        setError(
          "Ingresa al menos 3 observaciones categóricas separadas por coma o salto de línea.",
        );
        return;
      }

      newParam = {
        id: `custom-${Date.now()}`,
        name: cleanName,
        type: "qualitative",
        scale: qualScale,
        values: categories,
      };
    }

    saveCustomParameter(dataset.id, newParam);
    router.push(`${ROUTES.datasetDetail(dataset.id)}?param=${encodeURIComponent(newParam.id)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      {/* Cabecera */}
      <Card className="p-6">
        <Link
          href={ROUTES.datasetDetail(dataset.id)}
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-primary"
        >
          <ArrowLeftIcon className="size-3.5" />
          Volver al diagnóstico de {dataset.fileName}
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Crear Nuevo Parámetro
              </h1>
              <Badge>Constructor de Variable</Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted">
              Selecciona si la variable es <strong>Cuantitativa</strong> o{" "}
              <strong>Cualitativa</strong>. El motor abrirá automáticamente la interfaz
              de diagnóstico correspondiente.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadSample}
            className="shrink-0 self-start text-xs"
          >
            <PlusCircleIcon className="size-3.5 text-primary" />
            Cargar ejemplo {paramType === "quantitative" ? "numérico" : "categórico"}
          </Button>
        </div>
      </Card>

      {/* Paso 1: Tipo de dato */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <h2 className="text-sm font-semibold text-foreground">
            1. Tipo de Dato y Naturaleza de la Variable
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Selector excluyente
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => handleTypeSwitch("quantitative")}
            aria-pressed={paramType === "quantitative"}
            className={cn(
              "flex flex-col gap-3 rounded-xl border p-5 text-left transition-all",
              paramType === "quantitative"
                ? "border-primary bg-primary/10 shadow-[0_0_32px_-16px_var(--color-primary)]"
                : "border-border bg-background/50 hover:border-border-strong",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-primary">
                <BarChartIcon className="size-5" />
              </span>
              <Badge variant={paramType === "quantitative" ? "primary" : "neutral"}>
                {paramType === "quantitative" ? "Seleccionado" : "Numérica"}
              </Badge>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Parámetro Cuantitativo
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted">
                Valores numéricos medibles o contables. Habilita Media (μ), Mediana,
                Desviación Estándar (σ), Min/Max Heap O(1), Histograma con 3 presets de
                intervalos y Diagrama de Caja.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSwitch("qualitative")}
            aria-pressed={paramType === "qualitative"}
            className={cn(
              "flex flex-col gap-3 rounded-xl border p-5 text-left transition-all",
              paramType === "qualitative"
                ? "border-accent bg-accent/15 shadow-[0_0_32px_-16px_var(--color-accent)]"
                : "border-border bg-background/50 hover:border-border-strong",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-lg border border-accent/30 bg-accent/15 text-[#b5a7f8]">
                <PieChartIcon className="size-5" />
              </span>
              <Badge variant={paramType === "qualitative" ? "accent" : "neutral"}>
                {paramType === "qualitative" ? "Seleccionado" : "Categórica"}
              </Badge>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Parámetro Cualitativo
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted">
                Categorías, atributos o niveles nominales/ordinales. Habilita Moda
                dominante, Entropía de diversidad, Gráfico de frecuencias por categoría,
                Anillo proporcional y Tabla acumulada.
              </p>
            </div>
          </button>
        </div>
      </Card>

      {/* Paso 2: Configuración y observaciones */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="p-6 xl:col-span-7">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <h2 className="text-sm font-semibold text-foreground">
              2. Definición &amp; Muestra de Observaciones
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
              {paramType === "quantitative" ? "Modo Cuantitativo" : "Modo Cualitativo"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InputField
              label="Nombre del parámetro *"
              variant="inset"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                paramType === "quantitative"
                  ? "Ej. Temperatura_Corporal_C"
                  : "Ej. Diagnostico_Clinico"
              }
              icon={<HashIcon className="size-3.5" />}
            />

            {paramType === "quantitative" ? (
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Escala numérica
                </label>
                <div className="grid h-11 grid-cols-2 gap-1 rounded-lg border border-border bg-background/80 p-1">
                  {(["Float64", "Int32"] as const).map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => setQuantScale(scale)}
                      className={cn(
                        "rounded-md font-mono text-xs font-medium transition-colors",
                        quantScale === scale
                          ? "bg-primary text-primary-foreground"
                          : "text-muted hover:text-foreground",
                      )}
                    >
                      {scale}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Escala categórica
                </label>
                <div className="grid h-11 grid-cols-2 gap-1 rounded-lg border border-border bg-background/80 p-1">
                  {(["Nominal", "Ordinal"] as const).map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => setQualScale(scale)}
                      className={cn(
                        "rounded-md font-mono text-xs font-medium transition-colors",
                        qualScale === scale
                          ? "bg-accent text-foreground"
                          : "text-muted hover:text-foreground",
                      )}
                    >
                      {scale}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paramType === "quantitative" && (
              <InputField
                label="Unidad de medida (opcional)"
                variant="inset"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ej. cm, kg, °C, ms"
                className="sm:col-span-2"
              />
            )}

            <div className="flex flex-col gap-2 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="observations-input"
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
                >
                  Observaciones de muestra *
                </label>
                <span className="font-mono text-[10px] text-muted">
                  {paramType === "quantitative"
                    ? "Separadas por coma, espacio o salto de línea"
                    : "Separadas por coma o salto de línea"}
                </span>
              </div>

              <textarea
                id="observations-input"
                rows={5}
                value={rawValues}
                onChange={(e) => setRawValues(e.target.value)}
                placeholder={
                  paramType === "quantitative"
                    ? "Ej. 45.2, 48.1, 50.4, 47.9, 52.0, 46.8..."
                    : "Ej. Óptimo, Estable, Estable, Crítico, Observación..."
                }
                className="w-full rounded-lg border border-border bg-background/80 p-3 font-mono text-xs leading-6 text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {error && (
            <Alert tone="error" className="mt-4">
              {error}
            </Alert>
          )}
        </Card>

        {/* Vista previa en tiempo real */}
        <Card className="flex flex-col justify-between gap-5 p-6 xl:col-span-5">
          <div>
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h2 className="text-sm font-semibold text-foreground">
                3. Vista Previa del Motor
              </h2>
              <Badge variant={paramType === "quantitative" ? "primary" : "accent"}>
                {paramType === "quantitative" ? "Heaps O(1)" : "Frecuencias"}
              </Badge>
            </div>

            {paramType === "quantitative" ? (
              quantPreview ? (
                <div className="mt-5 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-background/70 p-3">
                      <p className="font-mono text-[10px] uppercase text-muted">
                        Muestra (N)
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold text-foreground">
                        {quantPreview.count}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-background/70 p-3">
                      <p className="font-mono text-[10px] uppercase text-muted">
                        Media (μ)
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold text-primary">
                        {quantPreview.mean.toFixed(2)} {unit}
                      </p>
                    </div>
                    <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
                      <p className="font-mono text-[10px] uppercase text-primary">
                        MinHeap.peek() O(1)
                      </p>
                      <p className="mt-1 font-mono text-base font-bold text-foreground">
                        {quantPreview.min}
                      </p>
                    </div>
                    <div className="rounded-lg border border-accent/25 bg-accent/10 p-3">
                      <p className="font-mono text-[10px] uppercase text-[#b5a7f8]">
                        MaxHeap.peek() O(1)
                      </p>
                      <p className="mt-1 font-mono text-base font-bold text-foreground">
                        {quantPreview.max}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-background/60 px-3 py-2.5 font-mono text-xs text-muted">
                    Rango calculado:{" "}
                    <strong className="text-foreground">
                      {quantPreview.range.toFixed(2)} {unit}
                    </strong>{" "}
                    · σ = {quantPreview.stdDev.toFixed(2)}
                  </div>

                  {quantParsed && quantParsed.invalid.length > 0 && (
                    <Alert tone="error">
                      Tokens inválidos detectados:{" "}
                      {quantParsed.invalid.slice(0, 3).join(", ")}
                    </Alert>
                  )}
                </div>
              ) : (
                <p className="mt-6 text-xs leading-6 text-muted">
                  Ingresa observaciones numéricas o haz clic en{" "}
                  <strong>Cargar ejemplo numérico</strong> para previsualizar el
                  cálculo de extremos con Min-Heap / Max-Heap en tiempo constante O(1).
                </p>
              )
            ) : qualPreview ? (
              <div className="mt-5 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-background/70 p-3">
                    <p className="font-mono text-[10px] uppercase text-muted">
                      Muestra (N)
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold text-foreground">
                      {qualPreview.count}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/70 p-3">
                    <p className="font-mono text-[10px] uppercase text-muted">
                      Categorías (k)
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold text-[#b5a7f8]">
                      {qualPreview.uniqueCount}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-accent/25 bg-accent/10 p-3">
                  <p className="font-mono text-[10px] uppercase text-[#b5a7f8]">
                    Moda dominante
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {qualPreview.mode}{" "}
                    <span className="font-mono text-xs text-muted">
                      ({qualPreview.modeCount} obs ·{" "}
                      {qualPreview.modePercentage.toFixed(1)}%)
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-xs leading-6 text-muted">
                Ingresa categorías separadas por coma o haz clic en{" "}
                <strong>Cargar ejemplo categórico</strong> para previsualizar la
                distribución de frecuencias y la moda dominante.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-4">
            <ButtonLink
              href={ROUTES.datasetDetail(dataset.id)}
              variant="outline"
              size="md"
              className="text-xs"
            >
              Cancelar
            </ButtonLink>
            <Button type="submit" size="md" className="text-xs font-semibold">
              <CheckCircleIcon className="size-3.5" />
              Crear Parámetro y Analizar
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </div>
        </Card>
      </div>
    </form>
  );
}

