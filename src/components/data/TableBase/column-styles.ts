import { computeStyles, resolveRecipes } from '@tenphi/tasty';

import type { Styles } from '@tenphi/tasty';

/**
 * Stamped on a body cell that carries a column's own `cellStyles` class, by
 * `TableView`. The class's rule is anchored on it, see `SELF`.
 */
const COLUMN_STYLES_ATTR = 'data-column-styles';

/**
 * The table paints every body cell from its root, through
 * `> Scroller > Table > Body > Row > Cell`: the root's doubled class plus five
 * `[data-element]` attributes, a specificity of (0,7,0). Tasty wraps every state
 * in `:where()`, so that chain is the whole of it, tint branches and the
 * consumer's table-level `cellStyles` included.
 *
 * A column's class is doubled as well, (0,2,0), and would lose every property
 * the table also sets (`color`, `fill`, `padding`…). Six more attribute
 * selectors take it to (0,8,0), so the column wins outright whichever of the
 * two rules was injected first. If the `Cell` chain in `styled.ts` ever grows,
 * this has to grow with it. `DataTable.browser.test.tsx` checks the cascade.
 */
const SELF = `&${`[${COLUMN_STYLES_ATTR}]`.repeat(6)}`;

/**
 * The wrapper per consumer object, so an object-form `cellStyles` (or a
 * function that returns a shared constant) is serialized once rather than on
 * every cell of every render.
 */
const WRAPPED = new WeakMap<Styles, Styles>();

/**
 * Keys tasty reads only from the top level of the object handed to
 * `computeStyles`: the at-rule definitions it registers next to the class.
 * Left inside `ColumnCell`, a `@keyframes` block would never be registered and
 * the cell's `animation` would name nothing, so these stay at the top.
 */
const TOP_LEVEL_KEYS = [
  '@keyframes',
  '@property',
  '@font-face',
  '@counter-style',
  '@function',
] as const;

function wrap(styles: Styles): Styles {
  let wrapped = WRAPPED.get(styles);

  if (!wrapped) {
    // Recipes resolve only at the top level of a style object, so they are
    // expanded before the styles move one level down.
    const cell: Styles = { ...resolveRecipes(styles), $: SELF };
    const top: Styles = {};

    for (const key of TOP_LEVEL_KEYS) {
      if (key in cell) {
        top[key] = cell[key];
        delete cell[key];
      }
    }

    wrapped = { ...top, ColumnCell: cell };
    WRAPPED.set(styles, wrapped);
  }

  return wrapped;
}

/**
 * A column's `cellStyles`, resolved through tasty into a class for the cell.
 *
 * Tasty keys a class on the CONTENT of the styles, not on the object, so every
 * cell with equal styles shares one class and one set of rules, and a function
 * that returns a handful of distinct objects produces a handful of classes —
 * however many cells, and however many fresh objects, it returns them as. After
 * the first cell, a lookup costs a small serialization and a map hit; the CSS
 * is built once.
 *
 * The styles land on the cell itself, so a bare state key in them (`hovered`,
 * `:hover`, a local `@state`) asks about the cell. That is NOT how `styles.Cell`
 * reads one: a sub-element's bare keys resolve against the table root, so a map
 * copied from the table-level `cellStyles` that keys on `shape=card` or
 * `column-dividers` matches nothing here. `@own(...)` asks about the cell in
 * both places.
 */
export function columnCellClassName(
  styles: Styles | null | undefined,
): string | undefined {
  if (!styles || Object.keys(styles).length === 0) return undefined;

  return computeStyles(wrap(styles)).className || undefined;
}
