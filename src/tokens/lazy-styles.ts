import type { Styles } from '@tenphi/tasty';

/**
 * Proxy that defers to `factory()` on every property / enumeration access.
 * Used so token exports stay import-safe while resolution waits until after a
 * host app calls `setPaletteConfig(...)` / `glaze.configure(...)`.
 *
 * The proxy holds no cache of its own — that is deliberate. Every factory here
 * memoizes against the palette config version, so delegating on each access is
 * what keeps these exports live when the palette is re-seeded at runtime. A
 * factory passed in must memoize.
 */
export function lazyStyles(factory: () => Styles): Styles {
  const resolve = () => factory();
  return new Proxy({} as Styles, {
    get(_target, prop) {
      if (prop === Symbol.toStringTag) return 'Object';
      return Reflect.get(resolve(), prop);
    },
    ownKeys() {
      return Reflect.ownKeys(resolve());
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Object.getOwnPropertyDescriptor(resolve(), prop);
    },
    has(_target, prop) {
      return Reflect.has(resolve(), prop);
    },
    getPrototypeOf() {
      return Object.prototype;
    },
  });
}
