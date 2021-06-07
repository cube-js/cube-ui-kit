import { useContext, createContext } from 'react';

export const RadioContext = createContext(null);

export function useRadioProvider() {
  return useContext(RadioContext);
}
