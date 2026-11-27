import type { Metadata } from "next";
import { Suspense } from "react";
import { findDatasetById, MOCK_DATASETS } from "@/entities/dataset";
import { DatasetDiagnosticsView } from "@/widgets/dataset-diagnostics";

export function generateDatasetStaticParams() {
  return MOCK_DATASETS.map((dataset) => ({ id: dataset.id }));
}

export const datasetDetailMetadata: Metadata = {
  title: "Panel Estadístico de Dataset",
};

export async function DatasetDetailPage({
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
          Cargando panel estadístico...
        </div>
      }
    >
      <DatasetDiagnosticsView datasetId={id} initialDataset={dataset} />
    </Suspense>
  );
}

