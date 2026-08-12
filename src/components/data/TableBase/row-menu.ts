import { Children, Fragment, isValidElement } from 'react';

import type { ReactNode } from 'react';

/**
 * Reserved key for the `⋮` trigger column. Prefixed so it cannot collide with
 * a real data key, and structural so the value pipeline, sorting and search all
 * skip it.
 */
export const ROW_MENU_COLUMN_KEY = '__cube-row-menu__';

/** Wide enough for one `ItemAction`, with no content width to spare. */
export const ROW_MENU_COLUMN_WIDTH: Record<string, number> = {
  xsmall: 32,
  small: 36,
  medium: 44,
  large: 48,
  xlarge: 52,
};

/**
 * Whether a resolved menu actually contains anything.
 *
 * A resolver returning `null` — or an empty fragment — gets no trigger at all,
 * rather than one that opens an empty popover.
 *
 * Fragments are unwrapped rather than counted. `Children.toArray` drops nullish
 * and boolean children but keeps a fragment as a single node, so
 * `<>{canPin && <Menu.Item/>}</>` read as one item even with nothing in it — and
 * a menu assembled from conditions is the common case, not the exotic one.
 */
export function isMenuEmpty(menu: ReactNode): boolean {
  if (menu == null || menu === false) return true;

  // `every` on an empty array is `true`, which is the base case: nothing left
  // after `toArray` pruned the nullish children means nothing to show.
  return Children.toArray(menu).every(
    (child) =>
      isValidElement(child) &&
      child.type === Fragment &&
      isMenuEmpty((child.props as { children?: ReactNode }).children),
  );
}

/**
 * Strips the `.$` prefix React adds to keys when children pass through
 * `Children.toArray`, so the consumer sees the key it wrote on `Menu.Item`.
 */
export function normalizeMenuAction(action: unknown): string {
  const value = String(action);

  return value.startsWith('.$') ? value.slice(2) : value;
}
