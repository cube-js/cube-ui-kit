import type { Placement } from 'react-aria';
import type { TabPlacement } from './types';

/**
 * Maps the parent Tabs `placement` to the popover placement for menus and
 * pickers anchored to the strip (tab overflow menu, context menu, TabPicker).
 *
 * The popover always opens **toward the panel area** so it never covers the
 * bar itself and stays inside the visible Tabs region. Tooltips are the only
 * surface that opens on the outer-edge side; menus and pickers must flow into
 * the content side instead.
 */
export const POPOVER_PLACEMENT_BY_TABS_PLACEMENT: Record<
  TabPlacement,
  Placement
> = {
  top: 'bottom start',
  bottom: 'top start',
  left: 'right top',
  right: 'left top',
};
