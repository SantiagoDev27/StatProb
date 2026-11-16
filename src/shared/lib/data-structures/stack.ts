/**
 * ============================================================================
 * ESTRUCTURA DE DATOS: PILA (STACK - LIFO) Y MOTOR DE DESHACER/REHACER
 * ============================================================================
 *
 * Una **Pila (`Stack<T>`)** es una estructura de datos lineal que sigue el
 * principio **LIFO** (*Last-In, First-Out* / Último en Entrar, Primero en Salir):
 * el último elemento insertado en el tope (`top`) es siempre el primero en ser
 * extraído.
 *
 * Representación estructural del tope de la pila:
 *
 *   push(Estado_3) ──►  ┌──────────────┐  ◄── peek() / pop()  [TOPE de la Pila]
 *                       │   Estado_3   │
 *                       ├──────────────┤
 *                       │   Estado_2   │
 *                       ├──────────────┤
 *                       │   Estado_1   │  [BASE de la Pila]
 *                       └──────────────┘
 *
 * ### Complejidad Temporal de `Stack<T>`
 * - **`push(item)` (Apilar)**: $\mathcal{O}(1)$ amortizado — inserta en el tope de la pila.
 * - **`pop()` (Desapilar)**: $\mathcal{O}(1)$ — extrae y devuelve el elemento del tope.
 * - **`peek()` (Inspeccionar tope)**: $\mathcal{O}(1)$ — consulta el tope sin extraerlo.
 * - **`clear()` (Vaciar)**: $\mathcal{O}(1)$ — reinicia la pila.
 *
 * ### Arquitectura de Doble Pila para Deshacer / Rehacer (`UndoRedoHistory<T>`)
 * El sistema de **Undo / Redo (`Ctrl + Z` / `Ctrl + Y`)** se modela con **dos pilas**:
 *   1. **`undoStack: Stack<T>` (Pila de Deshacer)**: almacena los estados pasados.
 *   2. **`redoStack: Stack<T>` (Pila de Rehacer)**: almacena los estados que fueron deshechos.
 *
 * Flujo de transiciones en $\mathcal{O}(1)$:
 *   - **Nueva acción del usuario (`record(estadoActual)`)**:
 *     1. `undoStack.push(estadoActual)` — guarda la instantánea previa en el tope.
 *     2. `redoStack.clear()` — invalida la rama futura porque se abrió una nueva línea de cambios.
 *   - **Deshacer (`Ctrl + Z` -> `undo(estadoActual)`)**:
 *     1. Extrae el estado inmediato anterior con `prev = undoStack.pop()`.
 *     2. Guarda el estado presente en la pila de rehacer: `redoStack.push(estadoActual)`.
 *     3. Restaura `prev` como nuevo estado activo.
 *   - **Rehacer (`Ctrl + Y` / `Ctrl + Shift + Z` -> `redo(estadoActual)`)**:
 *     1. Extrae el estado futuro con `next = redoStack.pop()`.
 *     2. Devuelve el estado actual a la pila de deshacer: `undoStack.push(estadoActual)`.
 *     3. Restaura `next` como nuevo estado activo.
 */

export class Stack<T> {
  private items: T[];
  private readonly maxCapacity: number;

  /**
   * @param maxCapacity Límite opcional de estados almacenados para acotar la memoria.
   * @param initialItems Elementos iniciales opcionales (del fondo hacia el tope).
   */
  constructor(maxCapacity = 100, initialItems?: readonly T[]) {
    this.maxCapacity = Math.max(1, maxCapacity);
    this.items = initialItems ? [...initialItems] : [];
    if (this.items.length > this.maxCapacity) {
      this.items = this.items.slice(this.items.length - this.maxCapacity);
    }
  }

  /** Cantidad de elementos apilados actualmente — O(1). */
  get size(): number {
    return this.items.length;
  }

  /** Indica si la pila está vacía — O(1). */
  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Apila un nuevo elemento en el tope (`top`) de la pila — O(1).
   * Si se supera `maxCapacity`, descarta el estado más antiguo en la base.
   */
  push(item: T): void {
    if (this.items.length >= this.maxCapacity) {
      this.items.shift();
    }
    this.items.push(item);
  }

  /**
   * Desapila y retorna el elemento en el tope (`top`) de la pila — O(1).
   * Si la pila está vacía, retorna `undefined`.
   */
  pop(): T | undefined {
    return this.items.pop();
  }

  /**
   * Consulta el elemento en el tope (`top`) sin eliminarlo de la pila — O(1).
   */
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  /** Vacía todos los elementos de la pila — O(1). */
  clear(): void {
    this.items = [];
  }

  /** Crea una copia independiente de la pila conservando sus elementos y capacidad. */
  clone(): Stack<T> {
    return new Stack<T>(this.maxCapacity, this.items);
  }

  /** Devuelve una copia de los elementos desde la base hasta el tope. */
  toArray(): T[] {
    return [...this.items];
  }
}

/**
 * Controlador inmutable/clonable de historial **Deshacer / Rehacer (Undo / Redo)**
 * basado en dos instancias de `Stack<T>`: `undoStack` y `redoStack`.
 */
export class UndoRedoHistory<T> {
  readonly undoStack: Stack<T>;
  readonly redoStack: Stack<T>;
  private readonly maxCapacity: number;

  constructor(
    maxCapacity = 100,
    undoStack?: Stack<T>,
    redoStack?: Stack<T>,
  ) {
    this.maxCapacity = maxCapacity;
    this.undoStack = undoStack ? undoStack.clone() : new Stack<T>(maxCapacity);
    this.redoStack = redoStack ? redoStack.clone() : new Stack<T>(maxCapacity);
  }

  /** Indica si hay estados anteriores disponibles para deshacer (`Ctrl + Z`). */
  get canUndo(): boolean {
    return !this.undoStack.isEmpty;
  }

  /** Indica si hay estados deshechos disponibles para rehacer (`Ctrl + Y`). */
  get canRedo(): boolean {
    return !this.redoStack.isEmpty;
  }

  /** Cantidad de pasos disponibles en la pila de deshacer (`undoStack`). */
  get undoCount(): number {
    return this.undoStack.size;
  }

  /** Cantidad de pasos disponibles en la pila de rehacer (`redoStack`). */
  get redoCount(): number {
    return this.redoStack.size;
  }

  /**
   * Registra el estado anterior antes de aplicar una modificación:
   * - Apila `previousState` en `undoStack`.
   * - Limpia `redoStack`.
   */
  record(previousState: T): UndoRedoHistory<T> {
    const nextUndo = this.undoStack.clone();
    nextUndo.push(previousState);
    const nextRedo = new Stack<T>(this.maxCapacity);
    return new UndoRedoHistory<T>(this.maxCapacity, nextUndo, nextRedo);
  }

  /**
   * Deshace la última acción (`Ctrl + Z`):
   * - Desapila el estado previo desde `undoStack.pop()`.
   * - Apila el `currentState` en `redoStack.push(currentState)`.
   */
  undo(currentState: T): {
    state: T | undefined;
    history: UndoRedoHistory<T>;
  } {
    if (this.undoStack.isEmpty) {
      return { state: undefined, history: this };
    }
    const nextUndo = this.undoStack.clone();
    const nextRedo = this.redoStack.clone();

    const restoredState = nextUndo.pop();
    if (restoredState !== undefined) {
      nextRedo.push(currentState);
    }

    return {
      state: restoredState,
      history: new UndoRedoHistory<T>(this.maxCapacity, nextUndo, nextRedo),
    };
  }

  /**
   * Rehace la última acción deshecha (`Ctrl + Y` o `Ctrl + Shift + Z`):
   * - Desapila el estado futuro desde `redoStack.pop()`.
   * - Apila el `currentState` en `undoStack.push(currentState)`.
   */
  redo(currentState: T): {
    state: T | undefined;
    history: UndoRedoHistory<T>;
  } {
    if (this.redoStack.isEmpty) {
      return { state: undefined, history: this };
    }
    const nextUndo = this.undoStack.clone();
    const nextRedo = this.redoStack.clone();

    const restoredState = nextRedo.pop();
    if (restoredState !== undefined) {
      nextUndo.push(currentState);
    }

    return {
      state: restoredState,
      history: new UndoRedoHistory<T>(this.maxCapacity, nextUndo, nextRedo),
    };
  }
}

