import { createContext, ReactNode } from 'react';

// Default breakpoints mirror Bootstrap defaults without md and xxl breakpoints.
export const BreakpointsContext = createContext([980]);

interface BreakpointsProviderProps {
  value: number[];
  children: ReactNode;
}

export function BreakpointsProvider({
  value,
  children,
}: BreakpointsProviderProps) {
  return (
    <BreakpointsContext.Provider value={value}>
      {children}
    </BreakpointsContext.Provider>
  );
}
