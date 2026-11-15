/**
 * ============================================================================
 * ESTRUCTURA DE DATOS: TRIE (ÁRBOL DE PREFIJOS)
 * ============================================================================
 *
 * Un **Trie** (del inglés *reTRIEval*, también llamado árbol digital o árbol de
 * prefijos) es una estructura de datos arbórea especializada en la búsqueda
 * rápida de cadenas de caracteres por prefijo.
 *
 * ### Principio de funcionamiento
 * A diferencia de un árbol binario de búsqueda donde cada nodo almacena una
 * clave completa, en un **Trie**:
 *   1. La **raíz** representa la cadena vacía `""`.
 *   2. Cada **arista** representa un carácter individual `c`.
 *   3. Cada **nodo** (`TrieNode<T>`) representa el prefijo formado por los
 *      caracteres desde la raíz hasta dicho nodo.
 *   4. Los caminos que comparten un mismo prefijo (por ejemplo, `"muestra"` y
 *      `"muestreo"`) **comparten los mismos nodos iniciales** `m -> u -> e -> s -> t -> r`.
 *
 * ### Complejidad temporal y espacial
 * Sea:
 *   - $L$: longitud de una palabra insertada.
 *   - $M$: longitud del prefijo buscado en la barra de búsqueda.
 *   - $K$: número de nodos en el subárbol bajo el nodo del prefijo.
 *   - $N$: cantidad total de datasets almacenados.
 *
 * - **Inserción (`insert`)**: $\mathcal{O}(L)$ — recorre o crea exactamente $L$
 *   nodos carácter por carácter.
 * - **Localización del prefijo (`findPrefixNode`)**: $\mathcal{O}(M)$ — depende
 *   únicamente de la longitud del texto escrito por el usuario, siendo
 *   independiente del número total de datasets $N$.
 * - **Autocompletado por prefijo (`searchByPrefix`)**: $\mathcal{O}(M + K)$ —
 *   baja $M$ niveles hasta el nodo del prefijo y recolecta mediante DFS las
 *   referencias almacenadas en su subárbol.
 */

/**
 * Normaliza una cadena para indexación y búsqueda insensible a mayúsculas y tildes.
 * Ejemplo: `"Análisis_Biométrico.XLSX"` -> `"analisis_biometrico.xlsx"`.
 */
export function normalizeTrieText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Divide un texto en tokens alfanuméricos individuales además de conservar
 * la cadena completa, permitiendo buscar un dataset por cualquiera de las
 * palabras de su nombre (ej. `"Q3_Market_Volatility"` -> `["q3_market_volatility", "q3", "market", "volatility"]`).
 */
export function tokenizeForTrie(input: string): string[] {
  const normalized = normalizeTrieText(input);
  if (!normalized) return [];

  const tokens = new Set<string>([normalized]);
  const parts = normalized.split(/[\s_.\-/]+/).filter(Boolean);
  for (const part of parts) {
    tokens.add(part);
  }
  return Array.from(tokens);
}

/**
 * Nodo interno del Trie.
 * - `children`: Mapa de transiciones `carácter -> TrieNode<T>` para acceso en O(1) promedio.
 * - `isEndOfWord`: Indica si en este carácter finaliza al menos una clave insertada.
 * - `terminalItems`: Conjunto de entidades (`T`, p. ej. `Dataset`) asociadas a la clave que termina aquí.
 */
export class TrieNode<T> {
  readonly children: Map<string, TrieNode<T>> = new Map();
  isEndOfWord = false;
  readonly terminalItems: Set<T> = new Set();
}

/**
 * Implementación genérica de un **Trie (Árbol de Prefijos)** que asocia claves
 * de texto y sus tokens con referencias a entidades de tipo `T` (como `Dataset`).
 */
export class Trie<T> {
  private readonly root: TrieNode<T> = new TrieNode<T>();
  private readonly allItems: Set<T> = new Set();

  /**
   * Inserta una clave exacta en el Trie asociándola al elemento `item` — O(L).
   *
   * Recorre la clave carácter a carácter desde `root`:
   *   - Si no existe una arista para el carácter `char`, crea un nuevo `TrieNode`.
   *   - Avanza al nodo hijo correspondiente.
   *   - Al finalizar la cadena, marca `isEndOfWord = true` y registra `item` en `terminalItems`.
   */
  insert(key: string, item: T): void {
    const normalized = normalizeTrieText(key);
    if (!normalized) return;

    this.allItems.add(item);
    let current = this.root;

    for (const char of normalized) {
      let nextNode = current.children.get(char);
      if (!nextNode) {
        nextNode = new TrieNode<T>();
        current.children.set(char, nextNode);
      }
      current = nextNode;
    }

    current.isEndOfWord = true;
    current.terminalItems.add(item);
  }

  /**
   * Indexa un elemento `item` a partir de múltiples textos descriptivos
   * (por ejemplo: nombre del dataset, nombre del archivo y formato).
   * Cada texto se descompone en tokens y cada token se inserta en el Trie.
   */
  insertDocument(fields: readonly string[], item: T): void {
    this.allItems.add(item);
    for (const field of fields) {
      const tokens = tokenizeForTrie(field);
      for (const token of tokens) {
        this.insert(token, item);
      }
    }
  }

  /**
   * Busca el nodo que representa exactamente el prefijo `prefix` en tiempo O(M),
   * donde M es la longitud del prefijo.
   * Si algún carácter del prefijo no tiene transición en el árbol, retorna `undefined`
   * inmediatamente sin inspeccionar el resto de datos.
   */
  findPrefixNode(prefix: string): TrieNode<T> | undefined {
    const normalized = normalizeTrieText(prefix);
    if (!normalized) return this.root;

    let current: TrieNode<T> | undefined = this.root;
    for (const char of normalized) {
      current = current.children.get(char);
      if (!current) {
        return undefined;
      }
    }
    return current;
  }

  /**
   * Devuelve todos los elementos `T` cuyas claves indexadas comienzan con `prefix`.
   * Complejidad: O(M + K), donde M = longitud del prefijo y K = nodos del subárbol.
   */
  searchByPrefix(prefix: string): T[] {
    const startNode = this.findPrefixNode(prefix);
    if (!startNode) return [];

    const results = new Set<T>();
    this.collectSubtreeItems(startNode, results);
    return Array.from(results);
  }

  /**
   * Ejecuta una consulta de búsqueda que puede contener uno o varios términos
   * separados por espacios o guiones bajos.
   * - Si la consulta está vacía, devuelve todos los elementos indexados.
   * - Si contiene varios términos (ej. `"muestreo xlsx"`), busca cada prefijo en
   *   el Trie en O(M_i + K_i) e interseca los conjuntos resultantes.
   */
  search(query: string): T[] {
    const queryTokens = normalizeTrieText(query)
      .split(/[\s_.\-/]+/)
      .filter(Boolean);

    if (queryTokens.length === 0) {
      return Array.from(this.allItems);
    }

    let intersection: Set<T> | null = null;

    for (const token of queryTokens) {
      const matchesForToken = new Set(this.searchByPrefix(token));
      if (intersection === null) {
        intersection = matchesForToken;
      } else {
        const nextIntersection = new Set<T>();
        for (const candidate of intersection) {
          if (matchesForToken.has(candidate)) {
            nextIntersection.add(candidate);
          }
        }
        intersection = nextIntersection;
      }

      if (intersection.size === 0) {
        return [];
      }
    }

    return intersection ? Array.from(intersection) : [];
  }

  /**
   * Recorrido en profundidad (DFS iterativo con pila explícita) desde `node`
   * para recolectar todos los elementos `terminalItems` almacenados en el subárbol.
   */
  private collectSubtreeItems(node: TrieNode<T>, results: Set<T>): void {
    const stack: TrieNode<T>[] = [node];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current.isEndOfWord) {
        for (const item of current.terminalItems) {
          results.add(item);
        }
      }
      for (const child of current.children.values()) {
        stack.push(child);
      }
    }
  }
}

