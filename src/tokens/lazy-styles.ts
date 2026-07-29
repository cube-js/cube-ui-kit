import type { Styles } from '@tenphi/tasty';

/**
 * Proxy that materializes a `Styles` map on first property / enumeration
 * access. Used so token exports stay import-safe while resolution can wait
 * until after a host app calls `glaze.configure(...)`.
 */
export function lazyStyles(factory: () => Styles): Styles {
  let cache: Styles | undefined;
  const resolve = () => (cache ??= factory());
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
