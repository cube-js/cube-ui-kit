export class Lru<K, V> {
  private map = new Map<K, { prev: K | null; next: K | null; value: V }>();
  private head: K | null = null;
  private tail: K | null = null;

  constructor(private limit = 1000) {}

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
    if (this.head) this.map.get(this.head)!.prev = key;
    this.head = key;
    if (!this.tail) this.tail = key;
    this.map.set(key, node);
    if (this.map.size > this.limit) this.evict();
  }

  private touch(key: K, node: { prev: K | null; next: K | null; value: V }) {
    if (this.head === key) return; // already MRU

    // detach
    if (node.prev) this.map.get(node.prev)!.next = node.next;
    if (node.next) this.map.get(node.next)!.prev = node.prev;
    if (this.tail === key) this.tail = node.prev;

    // move to head
    node.prev = null;
    node.next = this.head;
    if (this.head) this.map.get(this.head)!.prev = key;
    this.head = key;
  }

  private evict() {
    const old = this.tail;
    if (!old) return;
    const node = this.map.get(old)!;
    if (node.prev) this.map.get(node.prev)!.next = null;
    this.tail = node.prev;
    this.map.delete(old);
  }

  clear() {
    this.map.clear();
    this.head = this.tail = null;
  }
}
