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
  { id: "q-2", label: "Muestra_Ensayo_A2", value: 103.87 },
  { id: "q-3", label: "Muestra_Ensayo_A3", value: 106.12 },
  { id: "q-4", label: "Muestra_Ensayo_A4", value: 98.74 },
  { id: "q-5", label: "Muestra_Ensayo_A5", value: 104.45 },
  { id: "q-6", label: "Muestra_Ensayo_A6", value: 108.91 },
];

export const INITIAL_QUALITATIVE_ROWS: QualitativeRow[] = [
  { id: "c-1", label: "CASE_#8901", category: "Satisfecho" },
  { id: "c-2", label: "CASE_#8902", category: "Muy Satisfecho" },
  { id: "c-3", label: "CASE_#8903", category: "Neutral" },
  { id: "c-4", label: "CASE_#8904", category: "Insatisfecho" },
  { id: "c-5", label: "CASE_#8905", category: "Muy Insatisfecho" },
  { id: "c-6", label: "CASE_#8906", category: "Satisfecho" },
  { id: "c-7", label: "CASE_#8907", category: "Satisfecho" },
  { id: "c-8", label: "CASE_#8908", category: "Muy Satisfecho" },
];

