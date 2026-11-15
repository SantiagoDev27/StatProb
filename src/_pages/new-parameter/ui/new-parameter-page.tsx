import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    title: dataset ? `Nuevo parámetro · ${dataset.fileName}` : "Nuevo parámetro",
  };
}

export async function NewParameterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dataset = findDatasetById(id);

  if (!dataset) {
    notFound();
  }

  return <ParameterCreatorForm dataset={dataset} />;
}

