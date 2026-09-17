/** A string is a literal field name; tuples explicitly address nested values. */
export type FormPath = string | readonly (string | number)[];

type Container = Record<string, unknown> | unknown[];

// Path copies and ingress copies share ownership, including across stores.
// A WeakSet does not keep old snapshots alive after subscribers release them.
const ownedContainers = new WeakSet<object>();

export function freezeContainer<T extends object>(value: T): T {
  ownedContainers.add(value);
  return Object.freeze(value);
}

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isContainer(value: unknown): value is Container {
  return Array.isArray(value) || isPlainObject(value);
}

/** The ADR's default dirty comparator: Object.is, then one structural level. */
export function formValueEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!isContainer(a) || !isContainer(b)) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b) && a.length !== b.length)
    return false;
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every(
      (key) =>
        Object.hasOwn(b, key) &&
        Object.is(Reflect.get(a, key), Reflect.get(b, key)),
    )
  );
}

export function normalizePath(path: FormPath): readonly string[] {
  const parts = typeof path === 'string' ? [path] : path;
  if (!parts.length) throw new Error('A form field path must not be empty.');
  return Object.freeze(
    parts.map((part) => {
      if (
        typeof part !== 'string' &&
        (!Number.isSafeInteger(part) || part < 0)
      ) {
        throw new Error(
          'A numeric form path segment must be a non-negative safe integer.',
        );
      }
      const key = String(part);
      if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
        throw new Error(`Unsafe form path segment: ${key}`);
      }
      return key;
    }),
  );
}

/** Escaping keeps literal dotted names distinct from nested tuple paths. */
export function getFieldKey(path: FormPath): string {
  return normalizePath(path)
    .map((part) => part.replace(/\\/g, '\\\\').replace(/\./g, '\\.'))
    .join('.');
}

export function readPath(root: unknown, path: readonly string[]): unknown {
  let value = root;
  for (const key of path) {
    if (!isContainer(value) || !Object.hasOwn(value, key)) return undefined;
    value = Reflect.get(value, key);
  }
  return value;
}

export function hasPath(root: unknown, path: readonly string[]): boolean {
  const parent = readPath(root, path.slice(0, -1));
  return isContainer(parent) && Object.hasOwn(parent, path[path.length - 1]);
}

/** Copy just the ancestor chain. Array deletion leaves indices in place. */
export function writePath(
  root: object,
  path: readonly string[],
  value: unknown,
  remove = false,
): object {
  function write(current: unknown, depth: number): unknown {
    const key = path[depth];
    const container = isContainer(current) ? current : undefined;
    const exists = !!container && Object.hasOwn(container, key);
    const previous = exists ? Reflect.get(container!, key) : undefined;
    if (remove && !exists) return current;
    const last = depth === path.length - 1;
    const next = last ? value : write(previous, depth + 1);
    if (!remove && exists && Object.is(previous, next)) return current;
    if (remove && !last && Object.is(previous, next)) return current;
    const copy: Container = Array.isArray(container)
      ? container.slice()
      : container
        ? { ...container }
        : depth > 0 && /^(0|[1-9]\d*)$/.test(key)
          ? []
          : {};
    if (remove && last) Reflect.deleteProperty(copy, key);
    else
      Object.defineProperty(copy, key, {
        value: next,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    return freezeContainer(copy);
  }
  return write(root, 0) as object;
}

/**
 * Own plain data without freezing caller-owned objects. Non-plain values (dates,
 * files, ReactNode errors, etc.) are opaque and must be treated as immutable.
 * Reusing an input reference means reusing its value, just like React state.
 */
export function createValueSnapshotter() {
  const copies = new WeakMap<object, unknown>();
  function snapshot<T>(value: T): T {
    if (!isContainer(value)) return value;
    if (ownedContainers.has(value)) return value;
    if (copies.has(value)) return copies.get(value) as T;
    const copy: Container = Array.isArray(value) ? new Array(value.length) : {};
    copies.set(value, copy);
    copies.set(copy, copy);
    for (const key of Object.keys(value)) {
      Object.defineProperty(copy, key, {
        value: snapshot(Reflect.get(value, key)),
        enumerable: true,
      });
    }
    return freezeContainer(copy) as T;
  }
  return snapshot;
}

/** Object.freeze(new Set()) still permits add/delete. Hide the writable set. */
export function readonlySet<T>(values: Iterable<T>): ReadonlySet<T> {
  const set = new Set(values);
  const view: ReadonlySet<T> = Object.freeze({
    get size() {
      return set.size;
    },
    has: (value: T) => set.has(value),
    entries: () => set.entries(),
    keys: () => set.keys(),
    values: () => set.values(),
    [Symbol.iterator]: () => set[Symbol.iterator](),
    forEach: (
      callback: (value: T, key: T, set: ReadonlySet<T>) => void,
      thisArg?: unknown,
    ) => {
      set.forEach((value) => callback.call(thisArg, value, value, view));
    },
  });
  return view;
}

export function sameMembers<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  return a.size === b.size && Array.from(a).every((value) => b.has(value));
}
