import { createContext, ReactNode, useContext } from 'react';

import type { Key } from '@react-types/shared';
import type {
  DraggableCollectionState,
  DroppableCollectionState,
  TabListState,
} from 'react-stately';
import type { CubeItemActionProps } from '../../actions/ItemAction';
import type { CubeMenuProps } from '../../actions/Menu';
import type { TabSize, TabType } from './types';

// =============================================================================
// Context Value Interface
// =============================================================================

export interface TabsContextValue {
  /** Tab list state from React Stately */
  state: TabListState<object>;
  /** Parent-level type default */
  type: TabType;
  /** Parent-level size default */
  size?: TabSize;
  /** Parent-level showActionsOnHover default */
  showActionsOnHover?: boolean;
  /** Parent-level isEditable default */
  isEditable?: boolean;
  /** Parent-level menu default */
  menu?: ReactNode;
  /** Parent-level menuTriggerProps default */
  menuTriggerProps?: Partial<CubeItemActionProps>;
  /** Parent-level menuProps default */
  menuProps?: Partial<CubeMenuProps<object>>;
  /** Parent-level contextMenu default */
  contextMenu?: boolean;
  /** Callback when tab is deleted */
  onDelete?: (key: Key) => void;
  /** Parent-level onAction callback */
  onAction?: (action: Key, tabKey: Key) => void;
  /** Drag state for reorderable tabs (undefined if not reorderable) */
  dragState?: DraggableCollectionState;
  /** Drop state for reorderable tabs (undefined if not reorderable) */
  dropState?: DroppableCollectionState;

  // Editing callbacks
  /** Current tab being edited (null if none) */
  editingKey: Key | null;
  /** Current edit value */
  editValue: string;
  /** Set the edit value */
  setEditValue: (value: string) => void;
  /** Start editing a tab */
  startEditing: (key: Key, currentTitle: string) => void;
  /** Submit the current edit */
  submitEditing: (
    key: Key,
    newTitle: string,
    tabOnTitleChange?: (title: string) => void,
  ) => void;
  /** Cancel the current edit */
  cancelEditing: () => void;
}

// =============================================================================
// Context
// =============================================================================

const TabsContext = createContext<TabsContextValue | null>(null);

TabsContext.displayName = 'TabsContext';

// =============================================================================
// Provider
// =============================================================================

export interface TabsProviderProps {
  value: TabsContextValue;
  children: ReactNode;
}

export function TabsProvider({ value, children }: TabsProviderProps) {
  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

// =============================================================================
// Hook
// =============================================================================

export function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('useTabsContext must be used within a TabsProvider');
  }

  return context;
}
