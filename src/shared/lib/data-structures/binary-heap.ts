/**
 * Implementación genérica de Binary Heap (Montículo Binario) sobre un arreglo plano.
 *
 * Un montículo binario es un árbol binario completo almacenado en un arreglo donde,
 * para cualquier nodo en el índice `i`:
 *   - Padre:        Math.floor((i - 1) / 2)
 *   - Hijo izq.:    2 * i + 1
 *   - Hijo der.:    2 * i + 2
 *
 * Propiedad de orden:
 *   - En un Min-Heap (`compare(a, b) < 0` cuando `a < b`), cada padre es <= que sus hijos,
 *     por lo que el valor mínimo SIEMPRE reside en la raíz (`data[0]`).
 *   - En un Max-Heap (`compare(a, b) < 0` cuando `a > b`), cada padre es >= que sus hijos,
 *     por lo que el valor máximo SIEMPRE reside en la raíz (`data[0]`).
 *
 * Complejidad temporal:
 *   - `peek()` (leer Mín o Máx):  O(1)  — acceso directo a la raíz `data[0]`
 *   - `push(value)`:              O(log n) — inserta al final y ejecuta `siftUp`
 *   - `pop()`:                    O(log n) — reemplaza raíz con último y ejecuta `siftDown`
 *   - Construcción (`heapify`):   O(n)  — algoritmo bottom-up de Floyd desde `n/2 - 1` hasta `0`
 */
export class BinaryHeap<T> {
  private readonly data: T[];
  private readonly compare: (a: T, b: T) => number;

  /**
   * @param compare Función de prioridad: debe devolver < 0 si `a` tiene mayor prioridad que `b`.
   * @param initialItems Colección opcional para construir el heap en O(n) mediante `heapify`.
   */
  constructor(compare: (a: T, b: T) => number, initialItems?: Iterable<T>) {
    this.compare = compare;
    this.data = initialItems ? Array.from(initialItems) : [];
    if (this.data.length > 1) {
      this.heapify();
    }
  }

  /** Cantidad de elementos en el montículo — O(1). */
  get size(): number {
    return this.data.length;
  }

  /** Indica si el montículo está vacío — O(1). */
  get isEmpty(): boolean {
    return this.data.length === 0;
  }

  /**
   * Devuelve el elemento extremo (mínimo en MinHeap, máximo en MaxHeap)
   * en tiempo constante O(1) sin modificar la estructura.
   */
  peek(): T | undefined {
    return this.data[0];
  }

  /** Inserta un nuevo elemento manteniendo la propiedad del heap — O(log n). */
  push(value: T): void {
    this.data.push(value);
    this.siftUp(this.data.length - 1);
  }

  /** Extrae y devuelve la raíz del montículo reordenando el árbol — O(log n). */
  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  /**
   * Construcción bottom-up (algoritmo de Floyd) en O(n):
   * las hojas (índices >= floor(n/2)) ya cumplen la propiedad trivialmente,
   * por lo que solo se hunden los nodos internos desde el último padre hasta la raíz.
   */
  private heapify(): void {
    for (let i = Math.floor(this.data.length / 2) - 1; i >= 0; i--) {
      this.siftDown(i);
    }
  }

  /** Sube el nodo en `index` mientras tenga mayor prioridad que su padre — O(log n). */
  private siftUp(index: number): void {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.compare(this.data[current], this.data[parent]) >= 0) break;
      this.swap(current, parent);
      current = parent;
    }
  }

  /** Desciende el nodo en `index` intercambiándolo con su hijo de mayor prioridad — O(log n). */
  private siftDown(index: number): void {
    let current = index;
    const length = this.data.length;

    while (true) {
      const left = 2 * current + 1;
      const right = 2 * current + 2;
      let best = current;

      if (left < length && this.compare(this.data[left], this.data[best]) < 0) {
        best = left;
      }
      if (right < length && this.compare(this.data[right], this.data[best]) < 0) {
        best = right;
      }
      if (best === current) break;

      this.swap(current, best);
      current = best;
    }
  }

  private swap(i: number, j: number): void {
    const tmp = this.data[i];
    this.data[i] = this.data[j];
    this.data[j] = tmp;
  }
}

/** Min-Heap numérico: `peek()` entrega el valor mínimo en O(1). */
export class MinHeap extends BinaryHeap<number> {
  constructor(initialItems?: Iterable<number>) {
    super((a, b) => a - b, initialItems);
  }
}

/** Max-Heap numérico: `peek()` entrega el valor máximo en O(1). */
export class MaxHeap extends BinaryHeap<number> {
  constructor(initialItems?: Iterable<number>) {
    super((a, b) => b - a, initialItems);
  }
}

/**
 * Par Min-Heap + Max-Heap sincronizado sobre un conjunto numérico.
 * Permite consultar `min` y `max` en tiempo constante O(1) para calcular
 * el rango (`max - min`) y los límites de los intervalos del histograma.
 */
export class MinMaxHeapPair {
  readonly minHeap: MinHeap;
  readonly maxHeap: MaxHeap;

  constructor(values: Iterable<number>) {
    const items = Array.isArray(values) ? values : Array.from(values);
    this.minHeap = new MinHeap(items);
    this.maxHeap = new MaxHeap(items);
  }

  /** Valor mínimo del conjunto en O(1). */
  get min(): number {
    return this.minHeap.peek() ?? 0;
  }

  /** Valor máximo del conjunto en O(1). */
  get max(): number {
    return this.maxHeap.peek() ?? 0;
  }

  /** Rango estadístico (`max - min`) calculado a partir de lecturas O(1). */
  get range(): number {
    if (this.minHeap.isEmpty) return 0;
    return this.max - this.min;
  }

  /** Inserta una observación en ambos montículos — O(log n). */
  insert(value: number): void {
    this.minHeap.push(value);
    this.maxHeap.push(value);
  }
}

