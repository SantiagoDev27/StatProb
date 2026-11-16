import type { Dataset } from "./types";

/** Generador pseudoaleatorio determinista (Mulberry32) para datos de prueba reproducibles. */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Genera `count` valores aproximadamente normales N(mean, stdDev) con atípicos opcionales. */
function generateNormalSample(
  seed: number,
  count: number,
  mean: number,
  stdDev: number,
  decimals = 1,
  outliers: number[] = [],
): number[] {
  const rand = createRng(seed);
  const factor = Math.pow(10, decimals);
  const baseCount = Math.max(0, count - outliers.length);
  const values: number[] = [];

  for (let i = 0; i < baseCount; i++) {
    const u1 = Math.max(1e-7, rand());
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const raw = mean + z * stdDev;
    values.push(Math.round(raw * factor) / factor);
  }

  for (const outlier of outliers) {
    values.push(outlier);
  }

  return values;
}

/** Genera `count` observaciones categóricas siguiendo pesos de probabilidad. */
function generateCategoricalSample(
  seed: number,
  count: number,
  weightedCategories: Array<[string, number]>,
): string[] {
  const rand = createRng(seed);
  const totalWeight = weightedCategories.reduce((acc, [, w]) => acc + w, 0);
  const values: string[] = [];

  for (let i = 0; i < count; i++) {
    let pick = rand() * totalWeight;
    let chosen = weightedCategories[0][0];
    for (const [label, weight] of weightedCategories) {
      pick -= weight;
      if (pick <= 0) {
        chosen = label;
        break;
      }
    }
    values.push(chosen);
  }

  return values;
}

export const MOCK_DATASETS: Dataset[] = [
  {
    id: "muestreo-biometrico",
    name: "Muestreo_Biometrico_",
    fileName: "Muestreo_Biometrico_N1240.xlsx",
    sidebarName: "Muestreo_Biometrico_N12...",
    repositoryLabel: "Bio_Analytics_Core",
    description:
      "Medidas de tendencia central, dispersión paramétrica, frecuencias categóricas y gráficos univariados listos para inspección clínica.",
    format: "XLSX",
    createdLabel: "Creado el 24 Oct · Matriz pegada",
    kindLabel: "Ingreso Directo",
    kind: "direct",
    sampleSize: "1,240",
    variablesCount: 6,
    sizeLabel: "4.8 MB",
    hasSecondaryAction: true,
    parameters: [
      {
        id: "estatura-cm",
        name: "Estatura_cm",
        type: "quantitative",
        scale: "Float64",
        unit: "cm",
        values: generateNormalSample(101, 1240, 48.2, 12.2, 1, [85.4, 87.2, 88.4]),
      },
      {
        id: "masa-corporal-kg",
        name: "Masa_Corporal_kg",
        type: "quantitative",
        scale: "Float64",
        unit: "kg",
        values: generateNormalSample(202, 1240, 68.4, 9.8, 1, [42.1, 102.6, 104.3]),
      },
      {
        id: "presion-sistolica-mmhg",
        name: "Presion_Sistolica_mmHg",
        type: "quantitative",
        scale: "Int32",
        unit: "mmHg",
        values: generateNormalSample(303, 1240, 122, 14, 0, [166, 168]),
      },
      {
        id: "glucosa-basal-mg-dl",
        name: "Glucosa_Basal_mg_dL",
        type: "quantitative",
        scale: "Float64",
        unit: "mg/dL",
        values: generateNormalSample(404, 1240, 94.6, 18.5, 1, [189.2, 198.0]),
      },
      {
        id: "grupo-sanguineo",
        name: "Grupo_Sanguineo",
        type: "qualitative",
        scale: "Nominal",
        values: generateCategoricalSample(505, 1240, [
          ["O+", 46],
          ["A+", 28],
          ["B+", 12],
          ["O-", 7],
          ["AB+", 4],
          ["A-", 3],
        ]),
      },
      {
        id: "nivel-actividad-fisica",
        name: "Nivel_Actividad_Fisica",
        type: "qualitative",
        scale: "Ordinal",
        values: generateCategoricalSample(606, 1240, [
          ["Moderado", 41],
          ["Activo", 29],
          ["Sedentario", 20],
          ["Alto Rendimiento", 10],
        ]),
      },
    ],
  },
  {
    id: "encuesta-satisfaccion",
    name: "Encuesta_Satisfaccion",
    fileName: "Encuesta_Satisfaccion_2026.csv",
    sidebarName: "Encuesta_Satisfaccion_20...",
    repositoryLabel: "UX_Research_Lab",
    description:
      "Evaluación multidimensional de experiencia de usuario, tiempos de atención y distribución de percepción por canal.",
    format: "CSV",
    createdLabel: "Creado ayer · Frecuencias",
    kindLabel: "Manual Agrupado",
    kind: "grouped",
    sampleSize: "480",
    variablesCount: 4,
    sizeLabel: "8.4 MB",
    hasSecondaryAction: true,
    parameters: [
      {
        id: "nivel-satisfaccion",
        name: "Nivel_Satisfaccion",
        type: "qualitative",
        scale: "Ordinal",
        values: generateCategoricalSample(707, 480, [
          ["Muy Satisfecho", 36],
          ["Satisfecho", 33],
          ["Neutral", 17],
          ["Insatisfecho", 9],
          ["Muy Insatisfecho", 5],
        ]),
      },
      {
        id: "canal-atencion",
        name: "Canal_Atencion",
        type: "qualitative",
        scale: "Nominal",
        values: generateCategoricalSample(808, 480, [
          ["Web Portal", 44],
          ["App Móvil", 31],
          ["Soporte Chat", 16],
          ["Teléfono", 9],
        ]),
      },
      {
        id: "tiempo-respuesta-seg",
        name: "Tiempo_Respuesta_seg",
        type: "quantitative",
        scale: "Float64",
        unit: "s",
        values: generateNormalSample(909, 480, 18.4, 4.9, 1, [34.2, 36.8]),
      },
      {
        id: "puntuacion-nps",
        name: "Puntuacion_NPS",
        type: "quantitative",
        scale: "Int32",
        unit: "pts",
        values: generateNormalSample(1010, 480, 8, 1.4, 0, [2, 3]),
      },
      {
        id: "nivel-actividad-fisica",
        name: "Nivel_Actividad_Fisica",
        type: "qualitative",
        scale: "Ordinal",
        values: generateCategoricalSample(1011, 480, [
          ["Moderado", 44],
          ["Activo", 31],
          ["Sedentario", 17],
          ["Alto Rendimiento", 8],
        ]),
      },
    ],
  },
  {
    id: "q3-market-volatility",
    name: "Q3_Market_Volatility",
    fileName: "Q3_Market_Volatility_Matrix.xlsx",
    sidebarName: "Q3_Market_Volatility_Matr...",
    repositoryLabel: "Quant_Finance_Core",
    description:
      "Series intradía de volatilidad implícita, retornos diarios y clasificación del régimen de liquidez del tercer trimestre.",
    format: "XLSX",
    createdLabel: "Creado hace 2 horas · Manual",
    kindLabel: "Manual Individual",
    kind: "individual",
    sampleSize: "620",
    variablesCount: 5,
    sizeLabel: "94.2 MB",
    parameters: [
      {
        id: "volatilidad-implicita",
        name: "Volatilidad_Implicita",
        type: "quantitative",
        scale: "Float64",
        unit: "pts",
        values: generateNormalSample(1111, 620, 21.5, 4.8, 2, [38.9, 41.2]),
      },
      {
        id: "retorno-diario-pct",
        name: "Retorno_Diario_pct",
        type: "quantitative",
        scale: "Float64",
        unit: "%",
        values: generateNormalSample(1212, 620, 0.42, 1.35, 2, [-4.8, 5.1]),
      },
      {
        id: "regimen-mercado",
        name: "Regimen_Mercado",
        type: "qualitative",
        scale: "Nominal",
        values: generateCategoricalSample(1313, 620, [
          ["Alcista", 38],
          ["Lateral", 34],
          ["Alta Volatilidad", 18],
          ["Bajista", 10],
        ]),
      },
      {
        id: "region-nodo",
        name: "Region_Nodo",
        type: "qualitative",
        scale: "Nominal",
        values: generateCategoricalSample(1314, 620, [
          ["US-East-1", 52],
          ["EU-West-1", 28],
          ["SA-East-1", 20],
        ]),
      },
      {
        id: "puntuacion-nps",
        name: "Puntuacion_NPS",
        type: "quantitative",
        scale: "Int32",
        unit: "pts",
        values: generateNormalSample(1315, 620, 7.8, 1.5, 0, [2, 3]),
      },
    ],
  },
  {
    id: "analisis-rendimiento",
    name: "Analisis_Rendimiento",
    fileName: "Analisis_Rendimiento_Q3.csv",
    sidebarName: "Analisis_Rendimiento_Q3...",
    repositoryLabel: "Ops_Telemetry_Lab",
    description:
      "Métricas de latencia de inferencia, uso de memoria y categorización de nodos del clúster de cálculo.",
    format: "CSV",
    createdLabel: "Creado el 12 Oct · Manual",
    kindLabel: "Manual Individual",
    kind: "individual",
    sampleSize: "350",
    variablesCount: 4,
    sizeLabel: "3.6 MB",
    parameters: [
      {
        id: "latencia-ms",
        name: "Latencia_Inferencia_ms",
        type: "quantitative",
        scale: "Float64",
        unit: "ms",
        values: generateNormalSample(1414, 350, 42.6, 8.4, 1, [74.5, 79.1]),
      },
      {
        id: "region-nodo",
        name: "Region_Nodo",
        type: "qualitative",
        scale: "Nominal",
        values: generateCategoricalSample(1515, 350, [
          ["US-East-1", 48],
          ["EU-West-1", 30],
          ["SA-East-1", 22],
        ]),
      },
      {
        id: "tiempo-respuesta-seg",
        name: "Tiempo_Respuesta_seg",
        type: "quantitative",
        scale: "Float64",
        unit: "s",
        values: generateNormalSample(1516, 350, 16.2, 4.1, 1, [31.5, 33.0]),
      },
      {
        id: "presion-sistolica-mmhg",
        name: "Presion_Sistolica_mmHg",
        type: "quantitative",
        scale: "Int32",
        unit: "mmHg",
        values: generateNormalSample(1517, 350, 121, 13, 0, [164, 169]),
      },
    ],
  },
  {
    id: "precios-inmuebles",
    name: "Precios_Inmuebles_Ci",
    fileName: "Precios_Inmuebles_Ciudad.xlsx",
    sidebarName: "Precios_Inmuebles_Ci...",
    repositoryLabel: "Urban_Econometrics",
    description:
      "Valoración por metro cuadrado, estrato socioeconómico y dispersión de precios residenciales.",
    format: "XLSX",
    createdLabel: "Creado el 18 Oct · Frecuencias",
    kindLabel: "Manual Agrupado",
    kind: "grouped",
    sampleSize: "520",
    variablesCount: 4,
    sizeLabel: "14.1 MB",
    hasSecondaryAction: true,
    parameters: [
      {
        id: "valor-m2",
        name: "Valor_Metro_Cuadrado",
        type: "quantitative",
        scale: "Float64",
        unit: "M COP",
        values: generateNormalSample(1616, 520, 5.4, 1.3, 2, [10.4, 11.1]),
      },
      {
        id: "tipo-inmueble",
        name: "Tipo_Inmueble",
        type: "qualitative",
        scale: "Nominal",
        values: generateCategoricalSample(1717, 520, [
          ["Apartamento", 58],
          ["Casa", 26],
          ["Loft", 10],
          ["Estudio", 6],
        ]),
      },
      {
        id: "volatilidad-implicita",
        name: "Volatilidad_Implicita",
        type: "quantitative",
        scale: "Float64",
        unit: "pts",
        values: generateNormalSample(1718, 520, 19.8, 4.2, 2, [35.4, 37.1]),
      },
      {
        id: "nivel-satisfaccion",
        name: "Nivel_Satisfaccion",
        type: "qualitative",
        scale: "Ordinal",
        values: generateCategoricalSample(1719, 520, [
          ["Muy Satisfecho", 34],
          ["Satisfecho", 35],
          ["Neutral", 18],
          ["Insatisfecho", 8],
          ["Muy Insatisfecho", 5],
        ]),
      },
    ],
  },
  {
    id: "cohorte-manual-cali",
    name: "Cohorte_Manual_Cali",
    fileName: "Cohorte_Manual_Cali.csv",
    sidebarName: "Cohorte_Manual_Cali...",
    repositoryLabel: "Bio_Cohort_Study",
    description:
      "Seguimiento longitudinal de cohorte clínica con parámetros fisiológicos e indicadores de adherencia.",
    format: "CSV",
    createdLabel: "Ingreso Manual · Creado hace 3 días",
    kindLabel: "Manual Individual",
    kind: "individual",
    sampleSize: "200",
    variablesCount: 4,
    sizeLabel: "48 KB",
    hasSecondaryAction: true,
    parameters: [
      {
        id: "frecuencia-cardiaca",
        name: "Frecuencia_Cardiaca_bpm",
        type: "quantitative",
        scale: "Int32",
        unit: "bpm",
        values: generateNormalSample(1818, 200, 72, 9, 0, [106, 112]),
      },
      {
        id: "adherencia-tratamiento",
        name: "Adherencia_Tratamiento",
        type: "qualitative",
        scale: "Ordinal",
        values: generateCategoricalSample(1919, 200, [
          ["Alta", 52],
          ["Media", 33],
          ["Baja", 15],
        ]),
      },
      {
        id: "masa-corporal-kg",
        name: "Masa_Corporal_kg",
        type: "quantitative",
        scale: "Float64",
        unit: "kg",
        values: generateNormalSample(1920, 200, 67.9, 9.4, 1, [44.0, 99.5]),
      },
      {
        id: "presion-sistolica-mmhg",
        name: "Presion_Sistolica_mmHg",
        type: "quantitative",
        scale: "Int32",
        unit: "mmHg",
        values: generateNormalSample(1921, 200, 124, 13, 0, [165, 170]),
      },
    ],
  },
];

export const SIDEBAR_DATASETS = MOCK_DATASETS.slice(0, 4);

export function findDatasetById(id: string): Dataset | undefined {
  return MOCK_DATASETS.find((dataset) => dataset.id === id);
}
