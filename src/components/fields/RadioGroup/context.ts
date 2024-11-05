import { createContext, useContext } from 'react';
import { RadioGroupState } from 'react-stately';

interface CubeRadioGroupState {
  isSolid?: boolean;
  name?: string;
  state: RadioGroupState;
}

export const RadioContext = createContext<CubeRadioGroupState | null>(null);

export function useRadioProvider(): CubeRadioGroupState | null {
  return useContext(RadioContext);
}
