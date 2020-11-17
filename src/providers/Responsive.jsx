import React, { createContext } from 'react';
import { pointsToZones } from '../utils/responsive';

export const ResponsiveContext = createContext(
  pointsToZones([1640, 1280, 960, 640]),
);

export default function ResponsiveProvider({ value, children }) {
  return (
    <ResponsiveContext.Provider value={pointsToZones(value)}>
      {children}
    </ResponsiveContext.Provider>
  );
}
