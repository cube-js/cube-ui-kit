import { createContext, useContext } from 'react';
import { RadioGroupState } from 'react-stately';

import { CubeItemProps } from '../../content/Item/Item';

interface CubeRadioGroupState {
  name?: string;
  state: RadioGroupState;
  size?: CubeItemProps['size'];
  buttonType?: CubeItemProps['type'];
  type?: 'radio' | 'button' | 'tabs';
  isDisabled?: boolean;
}

export const RadioContext = createContext<CubeRadioGroupState | null>(null);

export function useRadioProvider(): CubeRadioGroupState | null {
  return useContext(RadioContext);
}
