import { Styles, tasty } from '@tenphi/tasty';

import { Action } from '../../actions/Action/Action';
import { Item } from '../Item';

/**
 * Tree root.
 *
 * Renders as `role="treegrid"` (set on `gridProps` from `useTree`).
 *
 * Tree-wide modifiers (set on `TreeElement` itself):
 * - `has-height` — paired with `--tree-height` on inline `style`
 *   when the consumer passes a numeric `height` prop.
 */
export const TreeElement = tasty({
  qa: 'Tree',
  styles: {
    display: 'flex',
    flow: 'column',
    width: '100%',
    height: { '': 'auto', 'has-height': 'fixed $tree-height' },
    flexGrow: { '': 1, 'has-height': 0 },
    flexShrink: { '': 1, 'has-height': 0 },
    flexBasis: { '': 0, 'has-height': 'auto' },
    minHeight: 0,
    overflow: 'auto',
    scrollbar: 'thin',
    fill: '#clear',
    color: '#dark',
    transition: 'theme',
    outline: 0,
    padding: 0,
  },
});

/**
 * Per-row wrapper carrying `role="row"`, `rowProps` from
 * `useTreeItem`, and the `--tree-level` CSS custom property used by
 * `TreeRowItem` to compute its left padding.
 *
 * Has no visual styles of its own — the row's appearance lives on
 * the inner `TreeRowItem` (which extends `Item`).
 */
export const TreeNodeRow = tasty({
  qa: 'TreeRow',
  styles: {
    display: 'block',
    width: '100%',
    outline: 0,
  },
});

/**
 * The visible row: an `Item` extension that owns layout (full-width,
 * tree indent) only. Color treatment is delegated to the
 * `default.item` variant (see `DEFAULT_ITEM_STYLES` in
 * `data/item-themes.ts`) so the Tree row matches the canonical Item
 * look out of the box. `hovered` / `focused` / `pressed` mods are
 * propagated from `TreeNode` because react-aria's treegrid uses a
 * roving-tabindex "virtual focus" model and never sets those data
 * attributes itself.
 */
export const TreeRowItem = tasty(Item, {
  qa: 'TreeItem',
  type: 'item',
  size: 'medium',
  as: 'div',
  styles: {
    /**
     * `Item` is `inline-grid` by default, which leaves baseline
     * descender space below the row inside the block-level
     * `TreeNodeRow` and visually inflates the gap between rows
     * past the intended `1bw`. Force block-level grid here.
     */
    display: 'grid',
    width: '100%',
    /**
     * Per-level indent. `$tree-indent` is a local token that reads
     * `--tree-level` (set inline on the parent `TreeNodeRow`) with a
     * `0` fallback. Using `padding` shorthand (instead of
     * `paddingInlineStart`) so it overrides `Item`'s default
     * `padding: 0` reliably — a longhand override on a shorthand
     * loses to it in the cascade when both are emitted from the same
     * declaration block.
     */
    padding: 'left ($tree-indent * 1.5x)',
    '$tree-indent': '($tree-level, 0)',
    cursor: {
      '': 'pointer',
      disabled: 'not-allowed',
    },
  },
});

/**
 * Wraps the checkbox sitting in `Item`'s `prefix` slot. `Item`'s
 * built-in Prefix padding collapses to `0` whenever there's an icon
 * (which is always true for tree rows because the toggle/placeholder
 * occupies the icon slot). We re-introduce a small inline gap on
 * both sides so the checkbox isn't flush against the chevron and the
 * title.
 */
export const TreeNodeCheckboxWrapper = tasty({
  qa: 'TreeNodeCheckboxWrapper',
  styles: {
    display: 'grid',
    placeItems: 'center',
    placeContent: 'center',
    padding: '0 1x',
  },
});

const TOGGLE_BASE_STYLES: Styles = {
  display: 'grid',
  placeItems: 'center',
  placeContent: 'center',
  width: '3x',
  height: '3x',
  radius: true,
  transition: 'theme',
};

/**
 * Chevron toggle button placed in `Item`'s `icon` slot. Spreads
 * `expandButtonProps` from `useTreeItem` (an AriaButtonProps) and
 * stops the press from bubbling to the row's selection handler via
 * React Aria's PressResponder.
 */
export const TreeNodeToggle = tasty(Action, {
  qa: 'TreeNodeToggle',
  styles: {
    ...TOGGLE_BASE_STYLES,
    color: { '': '#dark-02', ':hover': '#dark' },
    fill: { '': '#clear', ':hover': '#dark.04' },
  },
});

/**
 * Non-interactive placeholder that occupies the same footprint as
 * `TreeNodeToggle` so leaf rows visually align with siblings that
 * have a chevron.
 */
export const TreeNodeTogglePlaceholder = tasty({
  styles: TOGGLE_BASE_STYLES,
});
