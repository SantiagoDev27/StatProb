/**
 * ============================================================================
 * ESTRUCTURA DE DATOS: LISTA DOBLEMENTE ENLAZADA (DOUBLY LINKED LIST)
 * ============================================================================
 *
 * Una **Lista Doblemente Enlazada** (*Doubly Linked List*) es una estructura
 * de datos lineal dinámica compuesta por una secuencia de nodos (`DoublyLinkedNode<T>`)
 * donde cada nodo mantiene **dos referencias (punteros)** explícitas:
 *
 *   1. `prev`: referencia al nodo predecesor (anterior) o `null` si es la cabeza (`head`).
 *   2. `next`: referencia al nodo sucesor (siguiente) o `null` si es la cola (`tail`).
 *   3. `value`: el dato almacenado en el nodo (por ejemplo, una entidad `Dataset`).
 *
 * Representación estructural en memoria:
 *
 *   null <- [prev | Dataset_1 | next] <-> [prev | Dataset_2 | next] <-> [prev | Dataset_3 | next] -> null
 *                     ^                                                             ^
 *                    head                                                          tail
 *
 * ### Complejidad Temporal de sus Operaciones
 * - **Inserción al inicio (`prepend`)**: $\mathcal{O}(1)$ — enlaza el nuevo nodo antes de `head`
 *   actualizando únicamente `newNode.next = head` y `head.prev = newNode`.
 * - **Inserción al final (`append`)**: $\mathcal{O}(1)$ — enlaza el nuevo nodo después de `tail`
 *   actualizando `tail.next = newNode` y `newNode.prev = tail`.
 * - **Desconexión de un nodo conocido (`removeNode`)**: $\mathcal{O}(1)$ — puentea los punteros
 *   vecinos (`node.prev.next = node.next` y `node.next.prev = node.prev`) sin necesidad de
 *   desplazar bloques contiguos de memoria como ocurre en un arreglo (`Array.splice` es $\mathcal{O}(N)$).
 * - **Búsqueda y eliminación por predicado (`removeWhere`)**: $\mathcal{O}(N)$ para localizar
 *   el nodo recorriendo desde `head`, seguido de $\mathcal{O}(1)$ para desconectarlo con `removeNode`.
 * - **Recorrido bidireccional (`toArray` / `toReverseArray`)**: $\mathcal{O}(N)$ siguiendo
 *   los punteros `.next` desde `head` o `.prev` desde `tail`.
 */

/**
 * Nodo individual de una Lista Doblemente Enlazada.
 */
export class DoublyLinkedNode<T> {
  value: T;
  prev: DoublyLinkedNode<T> | null = null;
  next: DoublyLinkedNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

/**
 * Implementación genérica de una **Lista Doblemente Enlazada (`DoublyLinkedList<T>`)**.
 */
export class DoublyLinkedList<T> implements Iterable<T> {
  private headNode: DoublyLinkedNode<T> | null = null;
  private tailNode: DoublyLinkedNode<T> | null = null;
  private count = 0;

  constructor(initialItems?: Iterable<T>) {
    if (initialItems) {
      for (const item of initialItems) {
        this.append(item);
      }
    }
  }

  /** Construye una lista doblemente enlazada a partir de cualquier iterable en O(N). */
  static fromIterable<T>(items: Iterable<T>): DoublyLinkedList<T> {
    return new DoublyLinkedList<T>(items);
  }

  /** Referencia al primer nodo de la lista (`head`) — O(1). */
  get head(): DoublyLinkedNode<T> | null {
    return this.headNode;
  }

  /** Referencia al último nodo de la lista (`tail`) — O(1). */
  get tail(): DoublyLinkedNode<T> | null {
    return this.tailNode;
  }

  /** Cantidad actual de nodos enlazados en la lista — O(1). */
  get size(): number {
    return this.count;
  }

  /** Indica si la lista no contiene ningún nodo — O(1). */
  get isEmpty(): boolean {
    return this.count === 0;
  }

  /**
   * Inserta un nuevo valor al inicio (`head`) de la lista en tiempo constante O(1).
   * Ideal para registrar un nuevo dataset recién creado como el más reciente.
   */
  prepend(value: T): DoublyLinkedNode<T> {
    const node = new DoublyLinkedNode<T>(value);

    if (!this.headNode) {
      this.headNode = node;
      this.tailNode = node;
    } else {
      node.next = this.headNode;
      this.headNode.prev = node;
      this.headNode = node;
    }

    this.count += 1;
    return node;
  }

  /**
   * Inserta un nuevo valor al final (`tail`) de la lista en tiempo constante O(1).
   */
  append(value: T): DoublyLinkedNode<T> {
    const node = new DoublyLinkedNode<T>(value);

    if (!this.tailNode) {
      this.headNode = node;
      this.tailNode = node;
    } else {
      node.prev = this.tailNode;
      this.tailNode.next = node;
      this.tailNode = node;
    }

    this.count += 1;
    return node;
  }

  /**
   * Desconecta un nodo existente de la lista reasignando los punteros `prev` y `next`
   * de sus nodos adyacentes en tiempo constante O(1):
   *
   *   - Si `node.prev` existe: `node.prev.next = node.next`
   *   - Si `node === head`:    `head = node.next`
   *   - Si `node.next` existe: `node.next.prev = node.prev`
   *   - Si `node === tail`:    `tail = node.prev`
   */
  removeNode(node: DoublyLinkedNode<T>): T {
    if (node.prev) {
      node.prev.next = node.next;
    } else if (this.headNode === node) {
      this.headNode = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else if (this.tailNode === node) {
      this.tailNode = node.prev;
    }

    node.prev = null;
    node.next = null;
    this.count = Math.max(0, this.count - 1);

    return node.value;
  }

  /**
   * Busca el primer nodo cuyo valor cumpla `predicate` — O(N).
   */
  findNode(predicate: (value: T) => boolean): DoublyLinkedNode<T> | null {
    let current = this.headNode;
    while (current) {
      if (predicate(current.value)) {
        return current;
      }
      current = current.next;
    }
    return null;
  }

  /**
   * Busca un nodo mediante `predicate` y, si lo encuentra, lo elimina
   * desconectando sus enlaces `prev` y `next` mediante `removeNode`.
   * Retorna `true` si el nodo fue encontrado y eliminado, o `false` en caso contrario.
   */
  removeWhere(predicate: (value: T) => boolean): boolean {
    const targetNode = this.findNode(predicate);
    if (!targetNode) return false;
    this.removeNode(targetNode);
    return true;
  }

  /**
   * Recorre la lista desde `head` hasta `tail` siguiendo los punteros `.next`
   * y devuelve los elementos en un arreglo para su renderizado en la interfaz — O(N).
   */
  toArray(): T[] {
    const result: T[] = [];
    let current = this.headNode;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }

  /**
   * Recorre la lista en sentido inverso desde `tail` hasta `head` siguiendo
   * los punteros `.prev` — O(N).
   */
  toReverseArray(): T[] {
    const result: T[] = [];
    let current = this.tailNode;
    while (current) {
      result.push(current.value);
      current = current.prev;
    }
    return result;
  }

  /**
   * Iterador nativo (`for...of`) que avanza nodo por nodo desde `head` hasta `tail`.
   */
  *[Symbol.iterator](): Iterator<T> {
    let current = this.headNode;
    while (current) {
      yield current.value;
      current = current.next;
    }
  }
}

