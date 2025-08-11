export class Lru<K, V> {
  private map = new Map<K, { prev: K | null; next: K | null; value: V }>();
  private head: K | null = null;
  private tail: K | null = null;

  constructor(private limit = 1000) {
    // Normalize limit; fall back to sensible default (1000) to keep caching enabled
    let normalized = Number.isFinite(this.limit)
      ? Math.floor(this.limit)
      : 1000;
    if (normalized <= 0) normalized = 1000;
    this.limit = normalized;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.touch(key, node);
    return node.value;
  }

  set(key: K, value: V) {
    let node = this.map.get(key);
    if (node) {
      node.value = value;
      this.touch(key, node);
      return;
    }
    node = { prev: null, next: this.head, value };
    if (this.head) {
      const headNode = this.map.get(this.head);
      if (headNode) headNode.prev = key;
    }
    this.head = key;
    if (!this.tail) this.tail = key;
    this.map.set(key, node);
    if (this.map.size > this.limit) this.evict();
  }

  private touch(key: K, node: { prev: K | null; next: K | null; value: V }) {
    if (this.head === key) return; // already MRU

    // detach
    if (node.prev) {
      const prevNode = this.map.get(node.prev);
      if (prevNode) prevNode.next = node.next;
    }
    if (node.next) {
      const nextNode = this.map.get(node.next);
      if (nextNode) nextNode.prev = node.prev;
    }
    if (this.tail === key) this.tail = node.prev;

    // move to head
    node.prev = null;
    node.next = this.head;
    if (this.head) {
      const headNode = this.map.get(this.head);
      if (headNode) headNode.prev = key;
    }
    this.head = key;
  }

  private evict() {
    const old = this.tail;
    if (!old) return;
    const node = this.map.get(old);
    if (!node) {
      // Tail pointer is stale; reset pointers conservatively
      if (this.head === old) this.head = null;
      this.tail = null;
      return;
    }
    if (node.prev) {
      const prevNode = this.map.get(node.prev);
      if (prevNode) prevNode.next = null;
    }
    this.tail = node.prev;
    if (this.head === old) this.head = null;
    this.map.delete(old);
  }

  clear() {
    this.map.clear();
    this.head = this.tail = null;
  }
}
