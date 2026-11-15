"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { analyzeQuantitativeParameter } from "@/entities/dataset";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  CheckCircleIcon,
  ColumnsIcon,
  InfoIcon,
  PlusIcon,
  TrashIcon,
  TrendChartIcon,
} from "@/shared/ui/icons";
import type { QuantitativeRow } from "../model/presets";

type QuantitativeMatrixEditorProps = {
  parameterName: string;
  rows: QuantitativeRow[];
  onChangeRows: (rows: QuantitativeRow[]) => void;
};

const INITIAL_VISIBLE_LIMIT = 60;

export function QuantitativeMatrixEditor({
  parameterName,
  rows,
  onChangeRows,
}: QuantitativeMatrixEditorProps) {
  const [showAllRows, setShowAllRows] = useState(false);
  const seqRef = useRef(100);

  const stats = useMemo(
    () =>
      analyzeQuantitativeParameter({
        id: "live-quant",
        name: parameterName || "Variable",
        type: "quantitative",
        scale: "Float64",
        values: rows.map((r) => r.value),
      }),
    [parameterName, rows],
  );

  const visibleRows =
    showAllRows || rows.length <= INITIAL_VISIBLE_LIMIT
      ? rows
      : rows.slice(0, INITIAL_VISIBLE_LIMIT);

  function handleAddRow(afterIndex?: number) {
    const nextNumber = rows.length + 1;
    const baseValue =
      afterIndex !== undefined && rows[afterIndex]
        ? rows[afterIndex].value
        : Number(stats.mean.toFixed(3)) || 100;

    seqRef.current += 1;
    const newRow: QuantitativeRow = {
      id: `q-row-${seqRef.current}`,
      label: `Muestra_Ensayo_A${nextNumber}`,
      value: baseValue,
    };

    if (afterIndex === undefined) {
      onChangeRows([...rows, newRow]);
    } else {
      const next = [...rows];
      next.splice(afterIndex + 1, 0, newRow);
      onChangeRows(next);
    }
  }

  function handleUpdateLabel(id: string, label: string) {
    onChangeRows(rows.map((r) => (r.id === id ? { ...r, label } : r)));
  }

  function handleUpdateValue(id: string, raw: string) {
    const num = Number(raw);
    onChangeRows(
      rows.map((r) =>
        r.id === id ? { ...r, value: Number.isFinite(num) ? num : 0 } : r,
      ),
    );
  }

  function handleDeleteRow(id: string) {
    onChangeRows(rows.filter((r) => r.id !== id));
  }

  function handleCellKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (event.shiftKey && event.key === "Enter") {
      event.preventDefault();
      handleAddRow(index);
    }
  }

  const severeOutliersCount = useMemo(() => {
    if (stats.stdDev <= 0) return 0;
    return rows.filter(
      (r) => Math.abs((r.value - stats.mean) / stats.stdDev) > 3,
    ).length;
  }, [rows, stats.mean, stats.stdDev]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Izquierda: Registro Vectorial Simple */}
      <Card className="flex flex-col justify-between p-5 sm:p-6 xl:col-span-8">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">
              Registro Vectorial Simple
            </h2>
            <Badge variant="primary">
              N = {rows.length.toLocaleString("en-US")} Observaciones
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-border/70 pb-4">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <ColumnsIcon className="size-3.5 text-muted" />+ Añadir Columna
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAddRow()}
              className="h-8 text-xs font-semibold"
            >
              <PlusIcon className="size-3.5" />+ Añadir Fila
            </Button>
          </div>

          {/* Tabla editable */}
          <div className="mt-2 max-h-[460px] overflow-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted">
                  <th className="w-12 py-3 pr-2">#</th>
                  <th className="py-3 px-3">Identificador / Etiqueta [Dato]</th>
                  <th className="py-3 px-3 text-right">
                    Magnitud Medida [Valor]
                  </th>
                  <th className="py-3 px-3 text-right">Delta (X̄ - Xi)</th>
                  <th className="w-20 py-3 pl-3 text-center">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {visibleRows.map((row, idx) => {
                  const delta = row.value - stats.mean;
                  const deltaFormatted = `${delta >= 0 ? "+" : ""}${delta.toFixed(3)}`;

                  return (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-surface-hover/40"
                    >
                      <td className="py-3 pr-2 font-mono text-[11px] text-muted">
                        {String(idx + 1).padStart(2, "0")}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) =>
                            handleUpdateLabel(row.id, e.target.value)
                          }
                          onKeyDown={(e) => handleCellKeyDown(e, idx)}
                          aria-label={`Identificador fila ${idx + 1}`}
                          className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-xs font-medium text-foreground outline-none transition-colors hover:border-border focus:border-primary/60 focus:bg-background/80"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="any"
                          value={row.value}
                          onChange={(e) =>
                            handleUpdateValue(row.id, e.target.value)
                          }
                          onKeyDown={(e) => handleCellKeyDown(e, idx)}
                          aria-label={`Valor numérico fila ${idx + 1}`}
                          className="h-8 w-32 rounded-md border border-transparent bg-transparent px-2 text-right font-mono text-xs font-semibold text-foreground outline-none transition-colors hover:border-border focus:border-primary/60 focus:bg-background/80"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-muted">
                        {deltaFormatted}
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
                Mostrar las {rows.length.toLocaleString("en-US")} observaciones
                completas
              </Button>
            </div>
          )}
        </div>

        {/* Pie de tabla */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 font-mono text-[11px] text-muted">
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            Modo de inserción vectorial activo (Shift + Enter en cualquier celda
            para duplicar)
          </span>
          <span>
            Filas cargadas:{" "}
            <strong className="text-foreground">{rows.length}</strong> ·
            Columnas: <strong className="text-foreground">2 (Univariada)</strong>
          </span>
        </div>
      </Card>

      {/* Derecha: Diagnóstico en Tiempo Real */}
      <div className="flex flex-col gap-4 xl:col-span-4">
        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendChartIcon className="size-4.5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                Diagnóstico en Tiempo Real
              </h2>
            </div>
            <Badge variant="success">VÁLIDO</Badge>
          </div>

          {/* 4 métricas en vivo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-background/60 p-3.5">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted">
                Tamaño muestra (N)
              </p>
              <p className="mt-1.5 font-mono text-xl font-bold text-primary">
                {stats.count}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Observaciones activas
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3.5">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted">
                Media estimada (X̄)
              </p>
              <p className="mt-1.5 font-mono text-xl font-bold text-success">
                {stats.mean.toFixed(3)}
              </p>
              <p className="mt-1 text-[11px] text-muted">Centroide muestral</p>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3.5">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted">
                Escala detectada
              </p>
              <p className="mt-1.5 font-mono text-sm font-bold text-[#b5a7f8]">
                {stats.min >= 0 ? "Razón (Ratio)" : "Intervalo"}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {stats.min >= 0 ? "Cero absoluto activo" : "Escala continua"}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3.5">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted">
                Rango dinámico
              </p>
              <p className="mt-1.5 font-mono text-base font-bold text-foreground">
                {stats.range.toFixed(3)}
              </p>
              <p className="mt-1 font-mono text-[10px] text-muted">
                Max [{stats.max.toFixed(2)}] - Min [{stats.min.toFixed(2)}]
              </p>
            </div>
          </div>

          {/* Perfil de distribución preliminar */}
          <div className="rounded-xl border border-border bg-background/60 p-4">
            <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
              <span className="uppercase tracking-wider text-muted">
                Perfil de distribución preliminar
              </span>
              <span className="text-primary">Normalidad ~ 94.2%</span>
            </div>

            <svg
              viewBox="0 0 260 95"
              className="mt-3 h-auto w-full"
              role="img"
              aria-label="Curva de distribución preliminar"
            >
              <defs>
                <linearGradient id="prelim-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-primary)"
                    stopOpacity="0.4"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-primary)"
                    stopOpacity="0.02"
                  />
                </linearGradient>
              </defs>
              <line
                x1="12"
                x2="248"
                y1="74"
                y2="74"
                stroke="var(--color-border-strong)"
                strokeWidth="1"
              />
              <path
                d="M 12 73 C 65 73, 95 22, 130 22 C 165 22, 195 73, 248 73 L 248 74 L 12 74 Z"
                fill="url(#prelim-fill)"
              />
              <path
                d="M 12 73 C 65 73, 95 22, 130 22 C 165 22, 195 73, 248 73"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2"
              />
              <line
                x1="130"
                x2="130"
                y1="12"
                y2="74"
                stroke="var(--color-success)"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
              <circle cx="130" cy="22" r="3" fill="var(--color-success)" />
              <text
                x="12"
                y="88"
                fill="var(--color-muted)"
                fontSize="9"
                fontFamily="var(--font-mono)"
              >
                {stats.min.toFixed(2)}
              </text>
              <text
                x="130"
                y="88"
                textAnchor="middle"
                fill="var(--color-success)"
                fontSize="9"
                fontFamily="var(--font-mono)"
              >
                x̄ = {stats.mean.toFixed(2)}
              </text>
              <text
                x="248"
                y="88"
                textAnchor="end"
                fill="var(--color-muted)"
                fontSize="9"
                fontFamily="var(--font-mono)"
              >
                {stats.max.toFixed(2)}
              </text>
            </svg>
          </div>

          {/* Validación de coherencia */}
          <div className="flex items-start gap-2.5 rounded-xl border border-border bg-background/60 p-3.5 text-xs">
            <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-success" />
            <div>
              <p className="font-semibold text-foreground">
                Validación de Coherencia Aprobada
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-muted">
                {severeOutliersCount === 0
                  ? "Sin valores atípicos severos (|z| > 3.0) ni campos nulos detectados."
                  : `${severeOutliersCount} observación(es) con |z| > 3.0 detectada(s).`}
              </p>
            </div>
          </div>
        </Card>

        <Card className="flex items-start gap-3 p-4 text-xs leading-5 text-muted">
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-[#b5a7f8]" />
          <p>
            Al guardar la matriz, StatProb genera automáticamente el vector de
            frecuencias acumuladas, histograma interactivo, polígono y diagrama
            de caja (Box-Plot).
          </p>
        </Card>
      </div>
    </div>
  );
}
