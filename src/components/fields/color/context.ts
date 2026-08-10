import { createContext, useContext } from 'react';

/**
 * Marks the subtree inside a color popover.
 *
 * A `ColorSwatchGroup` offers a custom-color escape hatch, and that escape
 * hatch is a `ColorPicker` — which opens a popover that may itself contain a
 * swatch group. Reading this flag lets the group drop the escape hatch when it
 * is already inside one, so the recursion cannot be written even by accident.
 */
export const ColorPopoverContext = createContext(false);

export function useIsInsideColorPopover(): boolean {
  return useContext(ColorPopoverContext);
}
