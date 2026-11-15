import type { Metadata } from "next";
import { Suspense } from "react";
import { findDatasetById, MOCK_DATASETS } from "@/entities/dataset";
import { ParameterCreatorForm } from "@/features/create-parameter";

export function generateNewParameterStaticParams() {
  return MOCK_DATASETS.map((dataset) => ({ id: dataset.id }));
}

export async function generateNewParameterMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dataset = findDatasetById(id);
  return {
    title: dataset
      ? `Ingreso Manual · ${dataset.fileName}`
      : "Ingreso Manual de Datos",
  };
}

export async function NewParameterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dataset = findDatasetById(id);

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-muted">
          Cargando editor de parámetros...
        </div>
      }
    >
      <ParameterCreatorForm
        datasetId={id}
        initialDataset={dataset}
        mode="parameter"
      />
    </Suspense>
  );
}
