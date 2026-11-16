"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  getCustomParametersSnapshot,
  parseCustomParametersSnapshot,
  subscribeCustomParameters,
  useAllDatasets,
  type DatasetParameter,
} from "@/entities/dataset";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";
import { SlidersIcon, TrendChartIcon } from "@/shared/ui/icons";
import {
  buildDatasetGraph,
  GRAPH_CANVAS_HEIGHT,
  GRAPH_CANVAS_WIDTH,
  type DatasetGraphNode,
  type GraphNodeData,
  type ParameterGraphNode,
} from "../model/build-dataset-graph";

const VIEWBOX_WIDTH = GRAPH_CANVAS_WIDTH;
const VIEWBOX_HEIGHT = GRAPH_CANVAS_HEIGHT;

function getHexagonPoints(cx: number, cy: number, radius: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 3;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

function DatabaseCylinderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </svg>
  );
}

function FitViewIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function DatasetGraphView() {
  const allDatasets = useAllDatasets();

  // Snapshot serializado vía useSyncExternalStore para garantizar que el renderizado
  // de hidratación coincida exactamente con el HTML del servidor y luego sincronice sessionStorage
  const rawCustomParamsMap = useSyncExternalStore(
    subscribeCustomParameters,
    () => {
      const entries: Record<string, string> = {};
      for (const d of allDatasets) {
        entries[d.id] = getCustomParametersSnapshot(d.id);
      }
      return JSON.stringify(entries);
    },
    () => "{}",
  );

  const built = useMemo(() => {
    const customParamsByDatasetId: Record<string, DatasetParameter[]> = {};
    try {
      const parsed = JSON.parse(rawCustomParamsMap) as Record<string, string>;
      for (const [datasetId, rawParams] of Object.entries(parsed)) {
        customParamsByDatasetId[datasetId] =
          parseCustomParametersSnapshot(rawParams);
      }
    } catch {
      // Ignorar si el snapshot está vacío
    }
    return buildDatasetGraph(allDatasets, customParamsByDatasetId);
  }, [allDatasets, rawCustomParamsMap]);

  const { graph, datasetNodes, parameterNodes, edges } = built;

  // Posiciones arrastrables por el usuario (sobreescriben la posición calculada por defecto)
  const [customPositions, setCustomPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Estado de Zoom y Pan del lienzo interactivo
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const panStartRef = useRef<{
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
  } | null>(null);

  function getNodePosition(node: GraphNodeData): { x: number; y: number } {
    return customPositions[node.id] ?? { x: node.x, y: node.y };
  }

  const positionById = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const ds of datasetNodes) {
      map.set(ds.id, customPositions[ds.id] ?? { x: ds.x, y: ds.y });
    }
    for (const param of parameterNodes) {
      map.set(param.id, customPositions[param.id] ?? { x: param.x, y: param.y });
    }
    return map;
  }, [datasetNodes, parameterNodes, customPositions]);

  const activeFocusId = hoveredNodeId ?? selectedNodeId;

  // Vecinos directos en el Grafo mediante lista de adyacencia O(deg(v))
  const highlightedIds = useMemo(() => {
    if (!activeFocusId) return null;
    const neighbors = graph.getNeighbors(activeFocusId);
    const set = new Set<string>([activeFocusId, ...neighbors]);

    // Si el nodo seleccionado es un Parámetro puente, resaltamos también los datasets que comunica
    // Si es un Dataset, resaltamos también los datasets conectados a través de sus parámetros puente
    const focusedNode = graph.getNode(activeFocusId);
    if (focusedNode?.kind === "dataset") {
      for (const paramNeighborId of neighbors) {
        for (const secondHopId of graph.getNeighbors(paramNeighborId)) {
          if (secondHopId.startsWith("ds:")) {
            set.add(secondHopId);
          }
        }
      }
    }
    return set;
  }, [activeFocusId, graph]);

  const selectedNode = selectedNodeId
    ? graph.getNode(selectedNodeId)
    : undefined;

  function clientToSvgCoords(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = VIEWBOX_WIDTH / rect.width;
    const scaleY = VIEWBOX_HEIGHT / rect.height;
    const rawX = (clientX - rect.left) * scaleX;
    const rawY = (clientY - rect.top) * scaleY;
    return {
      x: (rawX - VIEWBOX_WIDTH / 2 - pan.x) / zoom + VIEWBOX_WIDTH / 2,
      y: (rawY - VIEWBOX_HEIGHT / 2 - pan.y) / zoom + VIEWBOX_HEIGHT / 2,
    };
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (draggingNodeId) {
      const coords = clientToSvgCoords(event.clientX, event.clientY);
      setCustomPositions((prev) => ({
        ...prev,
        [draggingNodeId]: {
          x: Math.max(50, Math.min(VIEWBOX_WIDTH - 50, Math.round(coords.x))),
          y: Math.max(45, Math.min(VIEWBOX_HEIGHT - 45, Math.round(coords.y))),
        },
      }));
      return;
    }

    if (isPanning && panStartRef.current && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const dx =
        (event.clientX - panStartRef.current.clientX) *
        (VIEWBOX_WIDTH / rect.width);
      const dy =
        (event.clientY - panStartRef.current.clientY) *
        (VIEWBOX_HEIGHT / rect.height);
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    }
  }

  function handlePointerUp() {
    setDraggingNodeId(null);
    setIsPanning(false);
    panStartRef.current = null;
  }

  function handleResetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCustomPositions({});
    setSelectedNodeId(null);
  }

  return (
    <div className="relative flex w-full flex-col gap-5">
      {/* Resplandor ambiental superior fiel al diseño */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 left-1/4 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/12 blur-3xl"
      />

      {/* Encabezado principal */}
      <header className="relative max-w-xl">
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
          Mapa de Relaciones:
          <br />
          Datasets &amp; Parámetros
        </h1>
        <p className="mt-2.5 text-xs leading-5 text-muted sm:text-sm">
          Exploración topológica interactiva de la red de datasets y sus
          variables métricas, categóricas y continuas compartidas. Permite
          evaluar redundancias estructurales y parámetros inter-experimento.
        </p>
      </header>

      {/* 3 Tarjetas KPI superiores fieles al diseño */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* KPI 1: Datasets Activos */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
              Datasets activos
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-primary">
                {datasetNodes.length}
              </span>
              <span className="font-mono text-xs text-muted">nodos</span>
            </p>
          </div>
          <span className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
            <DatabaseCylinderIcon className="size-4.5" />
          </span>
        </div>

        {/* KPI 2: Parámetros Mapeados */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
              Parámetros mapeados
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-[#b5a7f8]">
                {parameterNodes.length}
              </span>
              <span className="font-mono text-xs text-muted">variables</span>
            </p>
          </div>
          <span className="flex size-9 items-center justify-center rounded-lg border border-accent/30 bg-accent/15 text-[#b5a7f8]">
            <SlidersIcon className="size-4.5" />
          </span>
        </div>

        {/* KPI 3: Aristas / Intersecciones */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
              Aristas / intersecciones
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-success">
                {edges.length}
              </span>
              <span className="font-mono text-xs text-muted">links</span>
            </p>
          </div>
          <span className="flex size-9 items-center justify-center rounded-lg border border-success/30 bg-success/10 text-success">
            <TrendChartIcon className="size-4.5" />
          </span>
        </div>
      </div>

      {/* Lienzo principal interactivo del Grafo */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[#05080f] shadow-2xl">
        {/* Panel flotante de inspección cuando el usuario selecciona un nodo */}
        {selectedNode && (
          <div className=" absolute top-4 right-4 z-20 flex w-72 flex-col gap-2.5 rounded-xl border border-border-strong bg-surface/95 p-4 text-xs shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <span
                className="font-mono text-[10px] font-bold uppercase tracking-wider"
                style={{ color: selectedNode.color }}
              >
                {selectedNode.kind === "dataset"
                  ? "Nodo Principal · Dataset"
                  : selectedNode.isSharedBridge
                    ? "Nodo Secundario · Parámetro Puente"
                    : "Nodo Secundario · Parámetro"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                aria-label="Cerrar inspector"
                className="font-mono text-xs text-muted hover:text-foreground"
              >
                ×
              </button>
            </div>

            <p className="truncate text-sm font-bold text-foreground">
              {selectedNode.name}
            </p>

            {selectedNode.kind === "dataset" ? (
              <>
                <p className="font-mono text-[11px] text-muted">
                  Archivo: {selectedNode.fileName} · N ={" "}
                  {selectedNode.sampleSize}
                </p>
                <p className="font-mono text-[11px] text-muted">
                  Grado en el grafo:{" "}
                  <strong className="text-foreground">
                    {graph.getDegree(selectedNode.id)} parámetros conectados
                  </strong>
                </p>
                <Link
                  href={ROUTES.datasetDetail(selectedNode.datasetId)}
                  className="mt-1 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 font-mono text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Abrir Diagnóstico del Dataset →
                </Link>
              </>
            ) : (
              <>
                <p className="font-mono text-[11px] text-muted">
                  Tipo:{" "}
                  {selectedNode.paramType === "quantitative"
                    ? "Cuantitativo"
                    : "Cualitativo"}{" "}
                  ({selectedNode.scale})
                </p>
                <p className="font-mono text-[11px] text-muted">
                  Comunica:{" "}
                  <strong className="text-primary">
                    {selectedNode.datasetIds.length}{" "}
                    {selectedNode.datasetIds.length === 1
                      ? "dataset"
                      : "datasets"}
                  </strong>
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedNode.datasetIds.map((dsId) => {
                    const ds = datasetNodes.find((d) => d.datasetId === dsId);
                    if (!ds) return null;
                    return (
                      <Link
                        key={dsId}
                        href={`${ROUTES.datasetDetail(dsId)}?param=${encodeURIComponent(selectedNode.firstParamId)}`}
                        className="rounded-md border border-border-strong bg-background/80 px-2 py-1 font-mono text-[10px] text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {ds.shortName} →
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              setIsPanning(true);
              panStartRef.current = {
                clientX: e.clientX,
                clientY: e.clientY,
                panX: pan.x,
                panY: pan.y,
              };
            }
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          role="img"
          aria-label="Grafo interactivo de relaciones entre Datasets y Parámetros"
          className={cn(
            "h-[560px] w-full select-none sm:h-[620px]",
            isPanning ? "cursor-grabbing" : "cursor-grab",
          )}
        >
          <defs>
            <filter
              id="graph-glow"
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <radialGradient id="hub-halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22c3e6" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#22c3e6" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g
            transform={`translate(${VIEWBOX_WIDTH / 2 + pan.x}, ${VIEWBOX_HEIGHT / 2 + pan.y}) scale(${zoom}) translate(${-VIEWBOX_WIDTH / 2}, ${-VIEWBOX_HEIGHT / 2})`}
          >
            {/* 1. Capa de Aristas (Edges) */}
            {edges.map((edge) => {
              const sourcePos = positionById.get(edge.sourceId);
              const targetPos = positionById.get(edge.targetId);
              if (!sourcePos || !targetPos) return null;

              const isHighlighted =
                !highlightedIds ||
                (highlightedIds.has(edge.sourceId) &&
                  highlightedIds.has(edge.targetId));

              // Curva Bézier suave para las aristas de parámetros compartidos (puentes)
              const midX = (sourcePos.x + targetPos.x) / 2;
              const midY = (sourcePos.y + targetPos.y) / 2;
              const dx = targetPos.x - sourcePos.x;
              const dy = targetPos.y - sourcePos.y;
              const normalOffset = edge.isBridgeEdge ? 0.14 : 0;
              const ctrlX = midX - dy * normalOffset;
              const ctrlY = midY + dx * normalOffset;

              const pathD = edge.isBridgeEdge
                ? `M ${sourcePos.x} ${sourcePos.y} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${targetPos.x} ${targetPos.y}`
                : `M ${sourcePos.x} ${sourcePos.y} L ${targetPos.x} ${targetPos.y}`;

              return (
                <path
                  key={edge.id}
                  d={pathD}
                  fill="none"
                  stroke={edge.color}
                  strokeWidth={edge.isBridgeEdge ? 1.65 : 1.15}
                  strokeDasharray={edge.dashed ? "4 4" : undefined}
                  strokeOpacity={
                    isHighlighted ? (edge.isBridgeEdge ? 0.85 : 0.55) : 0.12
                  }
                  className="transition-opacity duration-200"
                />
              );
            })}

            {/* 2. Capa de Nodos Secundarios: Parámetros (Círculos y Cuadrados Redondeados) */}
            {parameterNodes.map((paramNode: ParameterGraphNode) => {
              const pos = getNodePosition(paramNode);
              const isHighlighted =
                !highlightedIds || highlightedIds.has(paramNode.id);
              const isSelected = selectedNodeId === paramNode.id;
              const degree = paramNode.datasetIds.length;
              const displayParamName =
                paramNode.name.length > 22
                  ? `${paramNode.name.slice(0, 20)}…`
                  : paramNode.name;
              const labelWidth = Math.max(66, displayParamName.length * 5.8 + 14);

              return (
                <g
                  key={paramNode.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setDraggingNodeId(paramNode.id);
                    setSelectedNodeId(paramNode.id);
                  }}
                  onPointerEnter={() => setHoveredNodeId(paramNode.id)}
                  onPointerLeave={() => setHoveredNodeId(null)}
                  className={cn(
                    "cursor-pointer transition-opacity duration-200",
                    isHighlighted ? "opacity-100" : "opacity-20",
                  )}
                >
                  {/* Halo luminoso para parámetros puente que comunican datasets */}
                  {paramNode.isSharedBridge && (
                    <>
                      <circle
                        r={degree >= 3 ? 32 : 24}
                        fill="url(#hub-halo)"
                      />
                      <circle
                        r={degree >= 3 ? 19 : 15}
                        fill="#07101c"
                        stroke={paramNode.color}
                        strokeWidth={degree >= 3 ? 2.5 : 1.9}
                        filter="url(#graph-glow)"
                      />
                    </>
                  )}

                  {/* Nodo secundario según tipo: Cuantitativo (Círculo) vs Cualitativo (Cuadrado redondeado) */}
                  {!paramNode.isSharedBridge &&
                    (paramNode.paramType === "quantitative" ? (
                      <circle
                        r={12}
                        fill="#090f1a"
                        stroke={isSelected ? paramNode.color : "#475569"}
                        strokeWidth={isSelected ? 2 : 1.4}
                      />
                    ) : (
                      <rect
                        x={-11}
                        y={-11}
                        width={22}
                        height={22}
                        rx={4.5}
                        fill="#090f1a"
                        stroke={isSelected ? paramNode.color : "#64748b"}
                        strokeWidth={isSelected ? 2 : 1.4}
                      />
                    ))}

                  {/* Etiqueta de cantidad de links en parámetros puente */}
                  {paramNode.isSharedBridge && (
                    <g transform="translate(0, -25)">
                      <rect
                        x={-24}
                        y={-9.5}
                        width={48}
                        height={14}
                        rx={3.5}
                        fill="#071521"
                        stroke={paramNode.color}
                        strokeOpacity={0.55}
                        strokeWidth={0.9}
                      />
                      <text
                        textAnchor="middle"
                        y={0.5}
                        fill={paramNode.color}
                        fontSize="8"
                        fontFamily="var(--font-mono)"
                        fontWeight="700"
                      >
                        {degree} LINKS
                      </text>
                    </g>
                  )}

                  {/* Código corto de unidad o escala centrado dentro del nodo */}
                  <text
                    x={0}
                    y={3.5}
                    textAnchor="middle"
                    fill={
                      paramNode.isSharedBridge ? paramNode.color : "#cbd5e1"
                    }
                    fontSize={paramNode.isSharedBridge ? "9.5" : "8.5"}
                    fontFamily="var(--font-mono)"
                    fontWeight="700"
                  >
                    {paramNode.shortCode}
                  </text>

                  {/* Fondo oscuro translúcido detrás del nombre para máxima legibilidad */}
                  <rect
                    x={-labelWidth / 2}
                    y={paramNode.isSharedBridge ? 19 : 15}
                    width={labelWidth}
                    height={16}
                    rx={4}
                    fill="#05080f"
                    fillOpacity={0.86}
                  />

                  {/* Nombre del parámetro centrado debajo del nodo */}
                  <text
                    x={0}
                    y={paramNode.isSharedBridge ? 30 : 26}
                    textAnchor="middle"
                    fill={
                      paramNode.isSharedBridge ? "#f1f5f9" : "#94a3b8"
                    }
                    fontSize={paramNode.isSharedBridge ? "10" : "9.5"}
                    fontFamily="var(--font-mono)"
                    fontWeight={paramNode.isSharedBridge ? "600" : "500"}
                  >
                    {displayParamName}
                  </text>
                </g>
              );
            })}

            {/* 3. Capa de Nodos Principales: Datasets (Hexágonos) */}
            {datasetNodes.map((dsNode: DatasetGraphNode) => {
              const pos = getNodePosition(dsNode);
              const isHighlighted =
                !highlightedIds || highlightedIds.has(dsNode.id);
              const isSelected = selectedNodeId === dsNode.id;
              const badgeWidth = Math.max(96, dsNode.shortName.length * 6.8 + 20);

              return (
                <g
                  key={dsNode.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setDraggingNodeId(dsNode.id);
                    setSelectedNodeId(dsNode.id);
                  }}
                  onPointerEnter={() => setHoveredNodeId(dsNode.id)}
                  onPointerLeave={() => setHoveredNodeId(null)}
                  className={cn(
                    "cursor-pointer transition-opacity duration-200",
                    isHighlighted ? "opacity-100" : "opacity-25",
                  )}
                >
                  {/* Halo exterior del hexágono del Dataset */}
                  <circle
                    r={38}
                    fill={dsNode.color}
                    fillOpacity={isSelected ? 0.2 : 0.1}
                  />

                  {/* Hexágono principal del Dataset */}
                  <polygon
                    points={getHexagonPoints(0, 0, 25)}
                    fill="#0b1322"
                    stroke={dsNode.color}
                    strokeWidth={isSelected ? 2.8 : 2}
                    filter="url(#graph-glow)"
                  />

                  {/* Etiqueta centrada debajo del hexágono con pastilla de contraste para no solapar nunca */}
                  <g transform="translate(0, 34)">
                    <rect
                      x={-badgeWidth / 2}
                      y={-9}
                      width={badgeWidth}
                      height={38}
                      rx={6}
                      fill="#05080f"
                      fillOpacity={0.9}
                      stroke={dsNode.color}
                      strokeOpacity={0.28}
                      strokeWidth={0.8}
                    />
                    <text
                      x={0}
                      y={1}
                      textAnchor="middle"
                      fill={dsNode.color}
                      fontSize="8"
                      fontFamily="var(--font-mono)"
                      fontWeight="700"
                      letterSpacing="0.08em"
                    >
                      DATASET
                    </text>
                    <text
                      x={0}
                      y={13.5}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="11"
                      fontFamily="var(--font-sans)"
                      fontWeight="700"
                    >
                      {dsNode.shortName}
                    </text>
                    <text
                      x={0}
                      y={24.5}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="8.5"
                      fontFamily="var(--font-mono)"
                    >
                      {dsNode.paramsCount} Params
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Esquina inferior izquierda: Minimapa + Controles de Zoom (+, -, Fit, 100%) */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
          {/* Minimapa topológico */}
          <div className="rounded-lg border border-border-strong bg-[#080d17]/95 p-2 shadow-xl backdrop-blur">
            <div className="relative h-16 w-28 overflow-hidden rounded border border-primary/50 bg-[#05080f]">
              {datasetNodes.map((dsNode) => {
                const pos = getNodePosition(dsNode);
                const leftPct = Math.max(
                  10,
                  Math.min(90, (pos.x / VIEWBOX_WIDTH) * 100),
                );
                const topPct = Math.max(
                  12,
                  Math.min(88, (pos.y / VIEWBOX_HEIGHT) * 100),
                );
                return (
                  <span
                    key={dsNode.id}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      backgroundColor: dsNode.color,
                    }}
                    className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  />
                );
              })}
              {/* Punto central luminoso de intersección en el minimapa */}
              <span
                className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_2px_var(--color-primary)]"
                aria-hidden
              />
            </div>
          </div>

          {/* Barra de Zoom (+ / - / Fit / 100%) */}
          <div className="inline-flex items-center gap-1 rounded-lg border border-border-strong bg-[#080d17]/95 px-2 py-1 font-mono text-xs text-muted shadow-xl backdrop-blur">
            <button
              type="button"
              onClick={() =>
                setZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))
              }
              aria-label="Acercar grafo"
              className="flex size-6 items-center justify-center rounded text-foreground transition-colors hover:bg-surface-hover"
            >
              +
            </button>
            <button
              type="button"
              onClick={() =>
                setZoom((z) => Math.max(0.55, Number((z - 0.15).toFixed(2))))
              }
              aria-label="Alejar grafo"
              className="flex size-6 items-center justify-center rounded text-foreground transition-colors hover:bg-surface-hover"
            >
              −
            </button>
            <span className="mx-0.5 h-3.5 w-px bg-border" aria-hidden />
            <button
              type="button"
              onClick={handleResetView}
              aria-label="Restablecer vista al 100%"
              title="Restablecer vista (100%)"
              className="flex size-6 items-center justify-center rounded text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <FitViewIcon className="size-3.5" />
            </button>
            <span className="min-w-[38px] text-right text-[11px] text-muted">
              {Math.round(zoom * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

