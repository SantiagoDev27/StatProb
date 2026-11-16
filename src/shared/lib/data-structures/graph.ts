/**
 * ============================================================================
 * ESTRUCTURA DE DATOS: GRAFO NO DIRIGIDO CON LISTAS DE ADYACENCIA (GRAPH)
 * ============================================================================
 *
 * Un **Grafo** $G = (V, E)$ consiste en un conjunto de vértices o nodos $V$
 * y un conjunto de aristas $E$ que conectan pares de nodos.
 *
 * En el dominio de StatProb, la red entre **Datasets** y **Parámetros** se
 * modela como un **Grafo Bipartito No Dirigido** $G = (V_D \cup V_P, E)$:
 *   - $V_D$: Nodos Principales (**Datasets**).
 *   - $V_P$: Nodos Secundarios (**Parámetros / Variables**).
 *   - $E$: Aristas que conectan un nodo Dataset $d \in V_D$ con un nodo
 *     Parámetro $p \in V_P$ si el parámetro pertenece a dicho dataset.
 *   - Cuando un mismo parámetro $p \in V_P$ tiene grado $\deg(p) \ge 2$,
 *     actúa como **nodo puente (intersección)** que comunica múltiples datasets.
 *
 * ### Representación en Memoria: Lista de Adyacencia
 * Se emplea un mapa de listas de adyacencia (`adjacency: Map<string, Map<string, TEdge>>`):
 *   - Para cada vértice $u$, `adjacency.get(u)` almacena un `Map` cuyas claves son
 *     los identificadores de sus vértices vecinos $v$ y cuyos valores son los
 *     metadatos de la arista $(u, v)$.
 *
 * ### Complejidad Temporal y Espacial
 *   - **Espacio**: $\mathcal{O}(|V| + |E|)$
 *   - **`addNode(id, data)`**: $\mathcal{O}(1)$ promedio
 *   - **`addEdge(u, v, data)`**: $\mathcal{O}(1)$ promedio
 *   - **`getDegree(id)`**: $\mathcal{O}(1)$
 *   - **`getNeighbors(id)`**: $\mathcal{O}(\deg(v))$
 *   - **Recorrido en anchura `bfs(startId)`**: $\mathcal{O}(|V| + |E|)$
 */

export class Graph<TNode, TEdge> {
  private readonly nodes: Map<string, TNode> = new Map();
  private readonly adjacency: Map<string, Map<string, TEdge>> = new Map();
  private readonly edges: Map<string, TEdge> = new Map();

  /** Cantidad total de nodos $|V|$ en el grafo — O(1). */
  get nodesCount(): number {
    return this.nodes.size;
  }

  /** Cantidad total de aristas $|E|$ en el grafo — O(1). */
  get edgesCount(): number {
    return this.edges.size;
  }

  /** Inserta o actualiza un nodo en el grafo — O(1). */
  addNode(id: string, data: TNode): void {
    this.nodes.set(id, data);
    if (!this.adjacency.has(id)) {
      this.adjacency.set(id, new Map());
    }
  }

  /** Obtiene los datos de un nodo por su identificador — O(1). */
  getNode(id: string): TNode | undefined {
    return this.nodes.get(id);
  }

  /** Verifica si un nodo existe en el grafo — O(1). */
  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  /**
   * Conecta dos nodos mediante una arista no dirigida `(sourceId, targetId)` — O(1).
   * Registra la adyacencia en ambos sentidos (`source -> target` y `target -> source`).
   */
  addEdge(
    edgeId: string,
    sourceId: string,
    targetId: string,
    data: TEdge,
  ): void {
    if (!this.adjacency.has(sourceId)) {
      this.adjacency.set(sourceId, new Map());
    }
    if (!this.adjacency.has(targetId)) {
      this.adjacency.set(targetId, new Map());
    }

    this.adjacency.get(sourceId)!.set(targetId, data);
    this.adjacency.get(targetId)!.set(sourceId, data);
    this.edges.set(edgeId, data);
  }

  /** Devuelve el grado $\deg(v)$ (número de conexiones incidentes) de un nodo — O(1). */
  getDegree(id: string): number {
    return this.adjacency.get(id)?.size ?? 0;
  }

  /** Devuelve los identificadores de todos los nodos vecinos adyacentes a `id` — O(deg(v)). */
  getNeighbors(id: string): string[] {
    const neighborsMap = this.adjacency.get(id);
    return neighborsMap ? Array.from(neighborsMap.keys()) : [];
  }

  /** Verifica si dos nodos son directamente adyacentes — O(1). */
  areConnected(nodeA: string, nodeB: string): boolean {
    return this.adjacency.get(nodeA)?.has(nodeB) ?? false;
  }

  /** Devuelve todos los nodos registrados en el grafo — O(|V|). */
  getAllNodes(): TNode[] {
    return Array.from(this.nodes.values());
  }

  /** Devuelve todas las aristas registradas en el grafo — O(|E|). */
  getAllEdges(): TEdge[] {
    return Array.from(this.edges.values());
  }

  /**
   * Recorrido en anchura (BFS - Breadth-First Search) desde `startId` — O(|V| + |E|).
   * Permite explorar componentes conexas de datasets comunicados por parámetros compartidos.
   */
  bfs(startId: string): string[] {
    if (!this.nodes.has(startId)) return [];

    const visited = new Set<string>([startId]);
    const queue: string[] = [startId];
    const order: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);

      const neighbors = this.adjacency.get(current);
      if (!neighbors) continue;

      for (const neighborId of neighbors.keys()) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      }
    }

    return order;
  }
}

