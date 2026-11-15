"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  getCustomParametersServerSnapshot,
  getCustomParametersSnapshot,
  mergeDatasetParameters,
  parseCustomParametersSnapshot,
  subscribeCustomParameters,
  type Dataset,
} from "@/entities/dataset";
import { DatasetHeader } from "./dataset-header";
import { DatasetParametersTable } from "./dataset-parameters-table";
import { QualitativeDiagnostics } from "./qualitative-diagnostics";
import { QuantitativeDiagnostics } from "./quantitative-diagnostics";

export function DatasetDiagnosticsView({ dataset }: { dataset: Dataset }) {
  const searchParams = useSearchParams();
  const queryParamId = searchParams.get("param");

  const customRaw = useSyncExternalStore(
    subscribeCustomParameters,
    () => getCustomParametersSnapshot(dataset.id),
    getCustomParametersServerSnapshot,
  );

  const customParameters = useMemo(
    () => parseCustomParametersSnapshot(customRaw),
    [customRaw],
  );

  const allParameters = useMemo(
    () => mergeDatasetParameters(dataset.parameters, customParameters),
    [dataset.parameters, customParameters],
  );

  const [manualSelection, setManualSelection] = useState<{
    datasetId: string;
    parameterId: string;
  } | null>(null);
  const [recalcTick, setRecalcTick] = useState(0);

  const activeSelectionId =
    manualSelection?.datasetId === dataset.id
      ? manualSelection.parameterId
      : (queryParamId ?? allParameters[0]?.id ?? "");

  const selectedParameter = useMemo(
    () =>
      allParameters.find((param) => param.id === activeSelectionId) ??
      allParameters[0],
    [allParameters, activeSelectionId],
  );

  if (!selectedParameter) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
        Este dataset aún no contiene parámetros para analizar.
      </div>
    );
  }

  return (
    <div key={recalcTick} className="flex w-full flex-col gap-6">
      <DatasetHeader
        dataset={dataset}
        parameters={allParameters}
        selectedParameter={selectedParameter}
        onSelectParameter={(parameterId) =>
          setManualSelection({ datasetId: dataset.id, parameterId })
        }
        onRecalculate={() => setRecalcTick((t) => t + 1)}
      />

      {selectedParameter.type === "quantitative" ? (
        <QuantitativeDiagnostics parameter={selectedParameter} />
      ) : (
        <QualitativeDiagnostics parameter={selectedParameter} />
      )}

      <DatasetParametersTable
        datasetId={dataset.id}
        parameters={allParameters}
        selectedParameterId={selectedParameter.id}
        onSelectParameter={(parameterId) =>
          setManualSelection({ datasetId: dataset.id, parameterId })
        }
      />
    </div>
  );
}
