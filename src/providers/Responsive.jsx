import React, { createContext } from 'react';

export const ResponsiveContext = createContext([980]);

export default function ResponsiveProvider({ value, children }) {
  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
}
