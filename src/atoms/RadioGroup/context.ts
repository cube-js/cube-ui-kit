import { createContext, useContext } from 'react';
import { RadioGroupState } from '@react-stately/radio';

export const RadioContext = createContext<RadioGroupState | null>(null);

export function useRadioProvider(): RadioGroupState | null {
  return useContext(RadioContext);
}
