import { createContext, useContext } from 'react';

import type { ToggleGroupState } from 'react-stately';
import type { SizeName } from '../../../tokens/sizes';

/** The item looks a toggle can take: each draws its selected state. */
export type ToggleGroupType = 'outline' | 'outline-2' | 'clear';

export interface ToggleGroupContextValue {
  state: ToggleGroupState;
  size: SizeName;
  type: ToggleGroupType;
  isInvalid?: boolean;
  isValid?: boolean;
  isReadOnly?: boolean;
}

export const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(
  null,
);

export function useToggleGroupContext() {
  const context = useContext(ToggleGroupContext);

  if (!context) {
    throw new Error('CubeUI: ToggleGroup.Item is used outside a ToggleGroup.');
  }

  return context;
}
