import {
  mergeDatasetParameters,
  type Dataset,
  type DatasetParameter,
  type ParameterType,
} from "@/entities/dataset";
import { Graph } from "@/shared/lib";

export type GraphNodeKind = "dataset" | "parameter";

export type DatasetGraphNode = {
  id: string;
  kind: "dataset";
  datasetId: string;
  name: string;
  shortName: string;
  fileName: string;
  format: string;
  paramsCount: number;
  sampleSize: string;
  color: string;
  x: number;
  y: number;
};

export type ParameterGraphNode = {
  id: string;
  kind: "parameter";
  paramKey: string;
  firstParamId: string;
  name: string;
  shortCode: string;
  paramType: ParameterType;
  scale: string;
  datasetIds: string[];
  isSharedBridge: boolean;
  color: string;
  x: number;
  y: number;
};

export type GraphNodeData = DatasetGraphNode | ParameterGraphNode;

export type GraphEdgeData = {
  id: string;
  sourceId: string;
  targetId: string;
  datasetId: string;
  parameterNodeId: string;
  color: string;
  dashed: boolean;
  isBridgeEdge: boolean;
};

export type BuiltDatasetGraph = {
  graph: Graph<GraphNodeData, GraphEdgeData>;
  datasetNodes: DatasetGraphNode[];
  parameterNodes: ParameterGraphNode[];
  edges: GraphEdgeData[];
  sharedParametersCount: number;
};

export const GRAPH_CANVAS_WIDTH = 1480;
export const GRAPH_CANVAS_HEIGHT = 860;

const DATASET_PALETTE = [
  "#22c3e6", // Cyan
  "#a78bfa", // Violeta
  "#10b981", // Esmeralda
  "#f59e0b", // Ámbar
  "#f43f5e", // Rosa Coral
  "#38bdf8", // Azul Cielo
];

function normalizeParameterKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .trim();
}

function getShortDatasetName(name: string): string {
  const cleaned = name.replace(/[_-]+$/, "");
  if (cleaned.length <= 16) return cleaned;
  return `${cleaned.slice(0, 15)}…`;
}

function getShortParameterCode(param: DatasetParameter): string {
  if (param.type === "quantitative" && param.unit) {
    return param.unit;
  }
  if (param.type === "qualitative") {
    return param.scale === "Ordinal" ? "Ord" : "Cat";
  }
  return param.scale === "Int32" ? "N" : "x̄";
}

/**
 * Algoritmo determinista de relajación por repulsión de cajas delimitadoras (Bounding-Box Force Relaxation).
 *
 * Garantiza que ningún par de nodos (ni sus etiquetas de texto) se solapen al abrir
 * la interfaz, separando iterativamente cualquier par cuya distancia horizontal y
 * vertical sea menor a `(minDistX, minDistY)`.
 */
function resolveNodeOverlaps(
  datasetNodes: DatasetGraphNode[],
  parameterNodes: ParameterGraphNode[],
): void {
  const allNodes: Array<{
    node: GraphNodeData;
    weight: number;
    anchorX: number;
    anchorY: number;
  }> = [
    ...datasetNodes.map((n) => ({
      node: n,
      weight: 2.5, // Los nodos principales (Datasets) tienen mayor inercia
      anchorX: n.x,
      anchorY: n.y,
    })),
    ...parameterNodes.map((n) => ({
      node: n,
      weight: 1.0,
      anchorX: n.x,
      anchorY: n.y,
    })),
  ];

  // Dimensiones mínimas de separación entre centros de nodos (incluyendo sus textos)
  const minDistX = 148;
  const minDistY = 86;
  const paddingX = 95;
  const paddingY = 68;

  for (let iter = 0; iter < 90; iter++) {
    let moved = false;

    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        const a = allNodes[i];
        const b = allNodes[j];

        let dx = b.node.x - a.node.x;
        let dy = b.node.y - a.node.y;

        // Si dos nodos caen exactamente en la misma coordenada, desempate determinista
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
          const angle = ((i * 7 + j * 13) % 12) * ((2 * Math.PI) / 12);
          dx = Math.cos(angle) * 2;
          dy = Math.sin(angle) * 2;
        }

        const nx = dx / minDistX;
        const ny = dy / minDistY;
        const ellipticalDist = Math.sqrt(nx * nx + ny * ny);

        if (ellipticalDist < 1) {
          moved = true;
          const overlap = (1 - ellipticalDist) * 0.55;
          const pushX = (dx / (ellipticalDist || 1)) * overlap;
          const pushY = (dy / (ellipticalDist || 1)) * overlap;

          const totalWeight = a.weight + b.weight;
          const ratioA = b.weight / totalWeight;
          const ratioB = a.weight / totalWeight;

          a.node.x -= pushX * ratioA;
          a.node.y -= pushY * ratioA;
          b.node.x += pushX * ratioB;
          b.node.y += pushY * ratioB;
        }
      }
    }

    // Suave atracción hacia su posición ancla ideal y ajuste dentro de los márgenes del lienzo
    for (const item of allNodes) {
      item.node.x += (item.anchorX - item.node.x) * 0.04;
      item.node.y += (item.anchorY - item.node.y) * 0.04;

      item.node.x = Math.max(
        paddingX,
        Math.min(GRAPH_CANVAS_WIDTH - paddingX, item.node.x),
      );
      item.node.y = Math.max(
        paddingY,
        Math.min(GRAPH_CANVAS_HEIGHT - paddingY, item.node.y),
      );
    }

    if (!moved) break;
  }

  for (const item of allNodes) {
    item.node.x = Math.round(item.node.x);
    item.node.y = Math.round(item.node.y);
  }
}

/**
 * Construye el Grafo Bipartito `Graph<GraphNodeData, GraphEdgeData>` a partir de
 * todos los datasets activos y sus parámetros, aplicando posicionamiento topológico
 * libre de colisiones.
 */
export function buildDatasetGraph(
  datasets: readonly Dataset[],
  customParamsByDatasetId: Readonly<Record<string, DatasetParameter[]>> = {},
): BuiltDatasetGraph {
  const graph = new Graph<GraphNodeData, GraphEdgeData>();
  const datasetNodes: DatasetGraphNode[] = [];
  const datasetNodeById = new Map<string, DatasetGraphNode>();

  const canvasCenterX = GRAPH_CANVAS_WIDTH / 2;
  const canvasCenterY = GRAPH_CANVAS_HEIGHT / 2;
  const ringRadiusX = datasets.length <= 4 ? 380 : 430;
  const ringRadiusY = datasets.length <= 4 ? 215 : 245;

  // 1. Resolver los parámetros de cada Dataset de forma pura (SSR/Hydration safe)
  const resolvedDatasets = datasets.map((dataset) => {
    const customParams = customParamsByDatasetId[dataset.id] ?? [];
    const mergedParams = mergeDatasetParameters(
      dataset.parameters,
      customParams,
    );
    return {
      dataset,
      parameters: mergedParams,
    };
  });

  // 2. Crear los Nodos Principales (Datasets) en el anillo intermedio-exterior
  resolvedDatasets.forEach(({ dataset, parameters }, index) => {
    const total = Math.max(1, resolvedDatasets.length);
    const baseAngle = -Math.PI * 0.75 + (index * 2 * Math.PI) / total;
    const x = Math.round(canvasCenterX + Math.cos(baseAngle) * ringRadiusX);
    const y = Math.round(canvasCenterY + Math.sin(baseAngle) * ringRadiusY);
    const color = DATASET_PALETTE[index % DATASET_PALETTE.length];

    const node: DatasetGraphNode = {
      id: `ds:${dataset.id}`,
      kind: "dataset",
      datasetId: dataset.id,
      name: dataset.name,
      shortName: getShortDatasetName(dataset.name),
      fileName: dataset.fileName,
      format: dataset.format,
      paramsCount: parameters.length,
      sampleSize: dataset.sampleSize,
      color,
      x,
      y,
    };

    datasetNodes.push(node);
    datasetNodeById.set(dataset.id, node);
  });

  // 3. Agrupar todos los parámetros por su clave normalizada
  type ParamAccumulator = {
    paramKey: string;
    firstParamId: string;
    name: string;
    shortCode: string;
    paramType: ParameterType;
    scale: string;
    datasetIds: string[];
  };

  const paramMap = new Map<string, ParamAccumulator>();

  for (const { dataset, parameters } of resolvedDatasets) {
    for (const param of parameters) {
      const key = normalizeParameterKey(param.name);
      const existing = paramMap.get(key);
      if (existing) {
        if (!existing.datasetIds.includes(dataset.id)) {
          existing.datasetIds.push(dataset.id);
        }
      } else {
        paramMap.set(key, {
          paramKey: key,
          firstParamId: param.id,
          name: param.name,
          shortCode: getShortParameterCode(param),
          paramType: param.type,
          scale: param.scale,
          datasetIds: [dataset.id],
        });
      }
    }
  }

  // Si algún dataset recién creado no comparte aún un parámetro por nombre,
  // lo comunicamos mediante el descriptor transversal "Media_Muestral_x̄"
  if (resolvedDatasets.length >= 2) {
    const connectedDatasets = new Set<string>();
    for (const acc of paramMap.values()) {
      if (acc.datasetIds.length >= 2) {
        for (const dsId of acc.datasetIds) {
          connectedDatasets.add(dsId);
        }
      }
    }

    const isolatedDatasetIds = resolvedDatasets
      .map((d) => d.dataset.id)
      .filter((id) => !connectedDatasets.has(id));

    if (isolatedDatasetIds.length > 0 && !paramMap.has("media_muestral_x")) {
      const allIds = resolvedDatasets.map((d) => d.dataset.id);
      paramMap.set("media_muestral_x", {
        paramKey: "media_muestral_x",
        firstParamId:
          resolvedDatasets[0]?.parameters[0]?.id ?? "media-muestral",
        name: "Media_Muestral_x̄",
        shortCode: "x̄",
        paramType: "quantitative",
        scale: "Float64",
        datasetIds: allIds,
      });
    }
  }

  // 4. Separar parámetros compartidos (puentes) y parámetros exclusivos (satélites)
  const sharedAccumulators: Array<{
    acc: ParamAccumulator;
    centroidAngle: number;
    centroidX: number;
    centroidY: number;
  }> = [];
  const exclusiveAccumulators: ParamAccumulator[] = [];

  for (const acc of paramMap.values()) {
    if (acc.datasetIds.length >= 2) {
      let sumX = 0;
      let sumY = 0;
      for (const dsId of acc.datasetIds) {
        const dsNode = datasetNodeById.get(dsId);
        if (dsNode) {
          sumX += dsNode.x;
          sumY += dsNode.y;
        }
      }
      const count = Math.max(1, acc.datasetIds.length);
      const cx = sumX / count;
      const cy = sumY / count;
      const angle = Math.atan2(cy - canvasCenterY, cx - canvasCenterX);
      sharedAccumulators.push({
        acc,
        centroidAngle: angle,
        centroidX: cx,
        centroidY: cy,
      });
    } else {
      exclusiveAccumulators.push(acc);
    }
  }

  // Ordenamos los parámetros compartidos por su ángulo respecto al centro para distribuirlos
  // limpiamente en un anillo interior amplio sin amontonarse en el centro
  sharedAccumulators.sort((a, b) => a.centroidAngle - b.centroidAngle);

  const parameterNodes: ParameterGraphNode[] = [];
  const edges: GraphEdgeData[] = [];

  const totalShared = sharedAccumulators.length;
  sharedAccumulators.forEach(({ acc, centroidX, centroidY }, idx) => {
    const ringAngle =
      -Math.PI / 2 + (idx * 2 * Math.PI) / Math.max(1, totalShared);
    const innerRadiusX = totalShared <= 4 ? 140 : 195;
    const innerRadiusY = totalShared <= 4 ? 95 : 125;

    const ringX = canvasCenterX + Math.cos(ringAngle) * innerRadiusX;
    const ringY = canvasCenterY + Math.sin(ringAngle) * innerRadiusY;

    // Combinamos la posición del anillo interior con el centroide de sus datasets
    const x = Math.round(ringX * 0.72 + centroidX * 0.28);
    const y = Math.round(ringY * 0.72 + centroidY * 0.28);

    const primaryDs = datasetNodeById.get(acc.datasetIds[0]);
    const color =
      acc.datasetIds.length >= 3
        ? "#22c3e6"
        : (primaryDs?.color ?? "#22c3e6");

    parameterNodes.push({
      id: `param:${acc.paramKey}`,
      kind: "parameter",
      paramKey: acc.paramKey,
      firstParamId: acc.firstParamId,
      name: acc.name,
      shortCode: acc.shortCode,
      paramType: acc.paramType,
      scale: acc.scale,
      datasetIds: acc.datasetIds,
      isSharedBridge: true,
      color,
      x,
      y,
    });
  });

  // Posicionar satélites exclusivos en arco hacia afuera de su Dataset
  const satelliteCountByDataset = new Map<string, number>();
  const satelliteTotalByDataset = new Map<string, number>();

  for (const acc of exclusiveAccumulators) {
    const dsId = acc.datasetIds[0];
    satelliteTotalByDataset.set(
      dsId,
      (satelliteTotalByDataset.get(dsId) ?? 0) + 1,
    );
  }

  for (const acc of exclusiveAccumulators) {
    const dsId = acc.datasetIds[0];
    const dsNode = datasetNodeById.get(dsId);
    const idxInDs = satelliteCountByDataset.get(dsId) ?? 0;
    const totalInDs = satelliteTotalByDataset.get(dsId) ?? 1;
    satelliteCountByDataset.set(dsId, idxInDs + 1);

    let x = canvasCenterX;
    let y = canvasCenterY;
    let color = "#22c3e6";

    if (dsNode) {
      const outwardAngle = Math.atan2(
        dsNode.y - canvasCenterY,
        dsNode.x - canvasCenterX,
      );
      const spread = Math.min(Math.PI * 0.9, totalInDs * 0.52);
      const angleOffset =
        totalInDs === 1
          ? 0
          : -spread / 2 + (idxInDs * spread) / (totalInDs - 1);
      const finalAngle = outwardAngle + angleOffset;
      const radius = 138 + (idxInDs % 2) * 26;

      x = Math.round(dsNode.x + Math.cos(finalAngle) * radius);
      y = Math.round(dsNode.y + Math.sin(finalAngle) * radius);
      color = dsNode.color;
    }

    parameterNodes.push({
      id: `param:${acc.paramKey}`,
      kind: "parameter",
      paramKey: acc.paramKey,
      firstParamId: acc.firstParamId,
      name: acc.name,
      shortCode: acc.shortCode,
      paramType: acc.paramType,
      scale: acc.scale,
      datasetIds: acc.datasetIds,
      isSharedBridge: false,
      color,
      x,
      y,
    });
  }

  // 5. Ejecutar resolución anticolisión para garantizar que ningún nodo ni etiqueta se solape
  resolveNodeOverlaps(datasetNodes, parameterNodes);

  // 6. Registrar todos los nodos y aristas en la estructura Graph
  for (const dsNode of datasetNodes) {
    graph.addNode(dsNode.id, dsNode);
  }

  for (const paramNode of parameterNodes) {
    graph.addNode(paramNode.id, paramNode);

    paramNode.datasetIds.forEach((dsId, linkIdx) => {
      const dsNode = datasetNodeById.get(dsId);
      if (!dsNode) return;

      const edgeId = `edge:${dsNode.id}<->${paramNode.id}`;
      const edgeData: GraphEdgeData = {
        id: edgeId,
        sourceId: dsNode.id,
        targetId: paramNode.id,
        datasetId: dsId,
        parameterNodeId: paramNode.id,
        color: dsNode.color,
        dashed: paramNode.isSharedBridge && linkIdx > 0,
        isBridgeEdge: paramNode.isSharedBridge,
      };

      graph.addEdge(edgeId, dsNode.id, paramNode.id, edgeData);
      edges.push(edgeData);
    });
  }

  return {
    graph,
    datasetNodes,
    parameterNodes,
    edges,
    sharedParametersCount: totalShared,
  };
}
