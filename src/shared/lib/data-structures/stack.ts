export class Stack<T> {
  private items: T[];
  private readonly maxCapacity: number;

  constructor(maxCapacity = 100, initialItems?: readonly T[]) {
    this.maxCapacity = Math.max(1, maxCapacity);
    this.items = initialItems ? [...initialItems] : [];
    if (this.items.length > this.maxCapacity) {
      this.items = this.items.slice(this.items.length - this.maxCapacity);
    }
  }

  get size(): number {
    return this.items.length;
  }

  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  push(item: T): void {
    if (this.items.length >= this.maxCapacity) {
      this.items.shift();
    }
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  clear(): void {
    this.items = [];
  }

  clone(): Stack<T> {
    return new Stack<T>(this.maxCapacity, this.items);
  }

  toArray(): T[] {
    return [...this.items];
  }
}

export class UndoRedoHistory<T> {
  readonly undoStack: Stack<T>;
  readonly redoStack: Stack<T>;
  private readonly maxCapacity: number;

  constructor(maxCapacity = 100, undoStack?: Stack<T>, redoStack?: Stack<T>) {
    this.maxCapacity = maxCapacity;
    this.undoStack = undoStack ? undoStack.clone() : new Stack<T>(maxCapacity);
    this.redoStack = redoStack ? redoStack.clone() : new Stack<T>(maxCapacity);
  }

  get canUndo(): boolean {
    return !this.undoStack.isEmpty;
  }

  get canRedo(): boolean {
    return !this.redoStack.isEmpty;
  }

  get undoCount(): number {
    return this.undoStack.size;
  }

  get redoCount(): number {
    return this.redoStack.size;
  }

  record(previousState: T): UndoRedoHistory<T> {
    const nextUndo = this.undoStack.clone();
    nextUndo.push(previousState);
    const nextRedo = new Stack<T>(this.maxCapacity);
    return new UndoRedoHistory<T>(this.maxCapacity, nextUndo, nextRedo);
  }

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

