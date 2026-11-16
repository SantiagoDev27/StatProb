import type { Metadata } from "next";
import { DatasetGraphView } from "@/widgets/dataset-graph";

export const metadata: Metadata = {
  title: "Mapa de Relaciones · Grafos",
};

export function GraphsPage() {
  return <DatasetGraphView />;
}

