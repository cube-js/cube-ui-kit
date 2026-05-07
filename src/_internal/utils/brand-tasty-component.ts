/**
 * Tasty 2.4+ uses an internal brand to distinguish components produced by
 * `tasty(...)` from arbitrary React components. Branded components keep
 * routing through the prop-forwarding `tastyWrap` path when extended via
 * `tasty(Component, options)`; non-branded components are routed through
 * `tastyElement({ as: Component, ... })` instead, which drops `as` from the
 * options and consumes a fixed set of tasty props (`isDisabled`, `mods`, ...)
 * before they reach the wrapped component.
 *
 * The brand symbol is created with `Symbol.for(...)` so it is stable across
 * bundle boundaries and across multiple copies of `@tenphi/tasty`. We use it
 * directly here because tasty 2.4.0 does not expose a public
 * `brandTastyComponent` helper yet; this mirrors the upstream implementation.
 */
const TASTY_COMPONENT_BRAND = Symbol.for('@tenphi/tasty.component');

/**
 * Marks a custom forwardRef/function component so that `tasty(Component, ...)`
 * keeps using the prop-forwarding wrap path. No-op for primitives or sealed
 * targets.
 */
export function brandTastyComponent<T>(component: T): T {
  if (
    component != null &&
    (typeof component === 'function' || typeof component === 'object')
  ) {
    try {
      (component as unknown as Record<PropertyKey, unknown>)[
        TASTY_COMPONENT_BRAND
      ] = true;
    } catch {
      // frozen/sealed targets — leave unbranded, they fall back to the
      // tastyElement path.
    }
  }

  return component;
}
