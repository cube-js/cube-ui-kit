import { createContext, useContext } from 'react';
import { RadioGroupState } from '@react-stately/radio';

interface CubeRadioGroupState extends RadioGroupState {
  isSolid?: boolean;
}

export const RadioContext = createContext<CubeRadioGroupState | null>(null);

export function useRadioProvider(): CubeRadioGroupState | null {
  return useContext(RadioContext);
}
