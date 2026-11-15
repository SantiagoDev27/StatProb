export type QuantitativeRow = {
  id: string;
  label: string;
  value: number;
};

export type QualitativeRow = {
  id: string;
  label: string;
  category: string;
};

export type QualitativePreset = {
  id: string;
  name: string;
  levels: string[];
};

export const DEFAULT_QUALITATIVE_PRESETS: QualitativePreset[] = [
  {
    id: "likert-5",
    name: "LIKERT 5 PTS",
    levels: [
      "Muy Insatisfecho",
      "Insatisfecho",
      "Neutral",
      "Satisfecho",
      "Muy Satisfecho",
    ],
  },
  {
    id: "binary",
    name: "BINARIO SÍ/NO",
    levels: ["No", "Sí"],
  },
  {
    id: "high-med-low",
    name: "ALTO/MEDIO/BAJO",
    levels: ["Bajo", "Medio", "Alto"],
  },
];

export const INITIAL_QUANTITATIVE_ROWS: QuantitativeRow[] = [
  { id: "q-1", label: "Muestra_Ensayo_A1", value: 101.325 },
];

export const INITIAL_QUALITATIVE_ROWS: QualitativeRow[] = [
  { id: "c-1", label: "CASE_#8901", category: "Satisfecho" },
];

