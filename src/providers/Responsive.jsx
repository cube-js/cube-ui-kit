import React, { createContext } from 'react';
import { pointsToZones } from '../utils/responsive';

export const ResponsiveContext = createContext(pointsToZones([980]));

export default function ResponsiveProvider({ value, children }) {
  return (
    <ResponsiveContext.Provider value={pointsToZones(value)}>
      {children}
    </ResponsiveContext.Provider>
  );
}
