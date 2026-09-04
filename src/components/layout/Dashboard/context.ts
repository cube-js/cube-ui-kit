import { createContext } from 'react';

import type {
  DashboardAuthoringContextValue,
  DashboardEditingContextValue,
  DashboardMetrics,
  DashboardSelectionContextValue,
  DashboardTreeContextValue,
} from './types';

export const DashboardMetricsContext = createContext<DashboardMetrics>({
  rowHeight: 80,
  columnGap: 16,
  rowGap: 16,
});

export const DashboardTreeContext = createContext<DashboardTreeContextValue>({
  containerDepth: 0,
  parentKind: 'root',
  parentId: null,
  layoutParentId: null,
  parentColumns: 12,
  parentRows: 1,
  ancestorIds: [],
  parentStackUsed: 0,
});

export const DashboardSelectionContext =
  createContext<DashboardSelectionContextValue>({
    selectionMode: 'none',
    selectedKeys: new Set(),
    register: () => () => {},
    select: () => {},
  });

export const DashboardEditingContext =
  createContext<DashboardEditingContextValue>({
    isEditing: false,
    movingId: null,
    arrivingIds: new Set(),
    markArriving: () => {},
    startMoving: () => {},
    stopMoving: () => {},
  });

export const DashboardAuthoringContext =
  createContext<DashboardAuthoringContextValue>({
    addItems: [],
  });
