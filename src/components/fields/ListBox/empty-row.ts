import type { Styles } from '@tenphi/tasty';

/**
 * The empty row of ListBox and FilterTree. Its label wraps, unlike an `Item`'s
 * one-line label: `emptyLabel` is any node, so a long message is read whole and
 * an action in it stays inside the popover.
 */
export const EMPTY_ROW_STYLES: Styles = {
  Label: { whiteSpace: 'normal' },
};
