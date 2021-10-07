import { createContext } from 'react';

export const BreakpointsContext = createContext([980]);

export function BreakpointsProvider({ value, children }) {
  return (
    <BreakpointsContext.Provider value={value}>
      {children}
    </BreakpointsContext.Provider>
  );
}
