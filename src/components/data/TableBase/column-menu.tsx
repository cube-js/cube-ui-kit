import { Children, cloneElement, isValidElement } from 'react';

import { Menu } from '../../actions/Menu';

import { normalizeMenuAction } from './row-menu';

import type { ReactElement, ReactNode } from 'react';
import type { CubeTableSortDirection } from './types';

/**
 * Menu keys the table itself honours.
 *
 * Sorting is the only capability the table owns, so it is the only thing that
 * can be a reserved key. `pin` and `hide` deliberately are not: `column.pin` and
 * `column.isHidden` are read-only declarative inputs with no controlled state
 * behind them, and reserving those keys would fix an API in string literals
 * before the state that backs it exists. They stay ordinary consumer keys and
 * are reported through `onColumnMenuAction` like anything else.
 */
export const COLUMN_MENU_SORT_KEYS = [
  'sort-asc',
  'sort-desc',
  'clear-sort',
] as const;

export type CubeColumnMenuSortKey = (typeof COLUMN_MENU_SORT_KEYS)[number];

export function isColumnMenuSortKey(key: string): key is CubeColumnMenuSortKey {
  return (COLUMN_MENU_SORT_KEYS as readonly string[]).includes(key);
}

/** The direction a reserved key asks for. `clear-sort` asks for none. */
export const COLUMN_MENU_SORT_DIRECTION: Record<
  CubeColumnMenuSortKey,
  CubeTableSortDirection | null
> = {
  'sort-asc': 'asc',
  'sort-desc': 'desc',
  'clear-sort': null,
};

export interface CubeColumnMenuContext {
  isSortable: boolean;
  /** This column's current direction, or `null` when it is unsorted. */
  sort: CubeTableSortDirection | null;
  disallowSortRemoval: boolean;
  /** Default labels, so `TableView` owns the i18n lookup and this stays pure. */
  labels: Record<CubeColumnMenuSortKey, string>;
}

interface MenuItemLikeProps {
  children?: ReactNode;
  isDisabled?: boolean;
}

/**
 * Whether a reserved key would do nothing if pressed.
 *
 * Redundancy is signalled by disabling the item rather than by ticking the
 * active one. A tick would mean `isSelected`, which `MenuItem` only honours when
 * the whole `Menu` runs at `selectionMode !== 'none'` (`MenuItem.tsx:43`) — and
 * switching the menu into a selection mode would turn the consumer's own items
 * into radios too, and could be overridden from `menuProps`. Disabling is local
 * to the item and cannot leak.
 */
function isSortKeyRedundant(
  key: CubeColumnMenuSortKey,
  ctx: CubeColumnMenuContext,
): boolean {
  if (!ctx.isSortable) return true;

  if (key === 'clear-sort') {
    return ctx.sort == null || ctx.disallowSortRemoval;
  }

  return ctx.sort === COLUMN_MENU_SORT_DIRECTION[key];
}

/**
 * Fills in default labels and disabled state for the reserved sort keys.
 *
 * `Children.forEach` rather than `Children.toArray`, because `toArray` rewrites
 * every key with a `.$` prefix — which breaks `selectedKeys` matching inside
 * `Menu`. Same reason `TabButton` does it this way.
 *
 * A label or an `isDisabled` the consumer wrote always wins; this only supplies
 * what was left out, so `<Menu.Item key="sort-asc" />` is the short form and
 * `<Menu.Item key="sort-asc">Oldest first</Menu.Item>` still says what it says.
 */
export function processColumnMenuItems(
  children: ReactNode,
  ctx: CubeColumnMenuContext,
): ReactNode {
  const result: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      result.push(child);

      return;
    }

    const element = child as ReactElement<MenuItemLikeProps>;
    const childProps = element.props;
    const key = element.key == null ? null : normalizeMenuAction(element.key);

    if (key != null && isColumnMenuSortKey(key)) {
      result.push(
        cloneElement(element, {
          children: childProps.children ?? ctx.labels[key],
          isDisabled: childProps.isDisabled ?? isSortKeyRedundant(key, ctx),
        }),
      );

      return;
    }

    // A `Menu.Section` holds the items; recurse so a reserved key inside one is
    // still resolved. Guarded on a non-text child so an ordinary item whose
    // label happens to be an element is not walked for no reason.
    if (
      childProps.children != null &&
      typeof childProps.children !== 'string' &&
      typeof childProps.children !== 'number'
    ) {
      result.push(
        cloneElement(element, {
          children: processColumnMenuItems(childProps.children, ctx),
        }),
      );

      return;
    }

    result.push(child);
  });

  // `Children.forEach` preserves order, and each entry keeps the key it was
  // written with — so React still reconciles these by key, not by index.
  return result;
}

/**
 * The reserved sort items, ready to drop into `header.menu`.
 *
 * ```tsx
 * header: { menu: <>{columnSortMenu()}<Menu.Item key="pin">Pin</Menu.Item></> }
 * ```
 *
 * Exists because `Menu.Item` requires `children` — it comes from react-stately's
 * `ItemProps` — so `<Menu.Item key="sort-asc" />` does not typecheck, and a
 * consumer filling the label in by hand would hardcode one language and lose the
 * translated one the table supplies. Passing `null` satisfies the type and reads
 * as "the table fills this in", which `processColumnMenuItems` then does.
 *
 * Hand-written keys still work — this is a convenience, not the only route.
 */
export function columnSortMenu(
  keys: readonly CubeColumnMenuSortKey[] = COLUMN_MENU_SORT_KEYS,
): ReactNode {
  return keys.map((key) => <Menu.Item key={key}>{null}</Menu.Item>);
}
