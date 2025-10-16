import { createContext, useContext } from 'react';
import { RadioGroupState } from 'react-stately';

import { CubeItemBaseProps } from '../../content/ItemBase/ItemBase';

interface CubeRadioGroupState {
  name?: string;
  state: RadioGroupState;
  size?: CubeItemBaseProps['size'];
  buttonType?: CubeItemBaseProps['type'];
  type?: 'radio' | 'button' | 'tabs';
  isDisabled?: boolean;
}

export const RadioContext = createContext<CubeRadioGroupState | null>(null);

export function useRadioProvider(): CubeRadioGroupState | null {
  return useContext(RadioContext);
}
