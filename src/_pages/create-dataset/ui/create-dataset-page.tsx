import type { Metadata } from "next";
import { Suspense } from "react";
import { ParameterCreatorForm } from "@/features/create-parameter";

export const metadata: Metadata = {
  title: "Crear Dataset Individual",
};

export function CreateDatasetPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-muted">
          Cargando creador de dataset...
        </div>
      }
    >
      <ParameterCreatorForm mode="create-dataset" />
    </Suspense>
  );
}

