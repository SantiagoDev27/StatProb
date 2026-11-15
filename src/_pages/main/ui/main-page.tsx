import type { Metadata } from "next";
import { DatasetsGrid, DatasetsHero } from "@/widgets/datasets-overview";

export const metadata: Metadata = {
  title: "Gestión de Datasets",
};

export function MainPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <DatasetsHero />
      <DatasetsGrid />
    </div>
  );
}
