import { CONTAINER_STYLES, filterBaseProps, Styles } from '@tenphi/tasty';
import {
  Children,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useEvent } from '../../../_internal/hooks';
import { isInsideOpenPopover, useLayoutEffect } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';

import {
  DashboardAuthoringContext,
  DashboardEditingContext,
  DashboardMetricsContext,
  DashboardSelectionContext,
  DashboardTreeContext,
} from './context';
import {
  DashboardGrid,
  DashboardHorizontalStack,
  DashboardVerticalStack,
} from './DashboardContainer';
import {
  DashboardContainerContent,
  DashboardRootAddControl,
} from './DashboardContainerContent';
import { DashboardTab, DashboardTabs } from './DashboardTabs';
import { DashboardWidget } from './DashboardWidget';
import { normalizeGap } from './placement';
import { DashboardElement } from './styles';

import type { ForwardedRef } from 'react';
import type {
  CubeDashboardProps,
  DashboardAuthoringContextValue,
  DashboardEditingContextValue,
  DashboardMetrics,
  DashboardNodeRegistration,
  DashboardSelectionContextValue,
  DashboardTreeContextValue,
} from './types';

export const DashboardRoot = forwardRef(function DashboardRoot(
  props: CubeDashboardProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    children,
    rowHeight = 80,
    gap = 16,
    isEditing = false,
    selectionMode = 'multiple',
    selectedKeys: controlledSelectedKeys,
    defaultSelectedKeys = [],
    onSelectionChange,
    addItems = [],
    onAddItem,
    styles: explicitStyles,
    style,
    ...otherProps
  } = props;
  const [columnGap, rowGap] = normalizeGap(gap);
  const [uncontrolledSelectedKeys, setUncontrolledSelectedKeys] =
    useState<string[]>(defaultSelectedKeys);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [arrivingIds, setArrivingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const acceptsArrivalsRef = useRef(false);
  const arrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const registrationsRef = useRef(new Map<string, DashboardNodeRegistration>());
  const isControlled = controlledSelectedKeys !== undefined;
  const selectedKeys =
    selectionMode === 'none'
      ? []
      : controlledSelectedKeys ?? uncontrolledSelectedKeys;
  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const commitSelection = useEvent((next: string[]) => {
    if (!isControlled) setUncontrolledSelectedKeys(next);
    onSelectionChange?.(next);
  });

  const register = useEvent(
    (id: string, registration: DashboardNodeRegistration) => {
      registrationsRef.current.set(id, registration);
      return () => {
        const current = registrationsRef.current.get(id);
        if (current === registration) registrationsRef.current.delete(id);
      };
    },
  );

  const select = useEvent((id: string, additive: boolean) => {
    if (selectionMode === 'none') return;
    const registration = registrationsRef.current.get(id);
    if (!registration) return;

    if (selectionMode === 'single' || !additive) {
      commitSelection([id]);
      return;
    }

    const current = new Set(selectedKeySet);
    if (current.has(id)) {
      current.delete(id);
      commitSelection([...current]);
      return;
    }

    for (const selectedId of current) {
      const selected = registrationsRef.current.get(selectedId);
      if (!selected) continue;

      if (registration.ancestorIds.includes(selectedId)) {
        return;
      }

      if (selected.parentId !== registration.parentId) {
        return;
      }

      if (selected.ancestorIds.includes(id)) {
        current.delete(selectedId);
      }
    }

    current.add(id);
    commitSelection([...current]);
  });

  /**
   * Any click that is not on a node clears the selection — Dashboard whitespace
   * and the rest of the page alike. A selection that survives a click elsewhere
   * reads as stuck: the node keeps its brand outline and its chrome while the
   * user is plainly working somewhere else.
   *
   * This deliberately listens on `document` rather than on the root's `onClick`.
   * React dispatches through the *React* tree, so a press inside a node's own
   * portaled menu bubbles to the root as if it had landed on whitespace and
   * deselects the node the menu belongs to. Three exclusions cover the rest:
   * a node keeps its selection, overlay content is portaled out of the
   * Dashboard's subtree so it has to be recognised by the popover registry
   * rather than by containment, and a target already detached by the action
   * that closed it can no longer be located at all.
   */
  const hasSelection = selectedKeySet.size > 0;
  useEffect(() => {
    if (!hasSelection) return;

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target?.isConnected) return;
      if (target.closest('[data-dashboard-node]')) return;
      if (isInsideOpenPopover(target)) return;

      commitSelection([]);
    };

    document.addEventListener('click', onDocumentClick);

    return () => document.removeEventListener('click', onDocumentClick);
  }, [commitSelection, hasSelection]);

  const startMoving = useEvent((id: string) => setMovingId(id));
  const stopMoving = useEvent((id: string) => {
    setMovingId((current) => (current === id ? null : current));
  });
  const markArriving = useEvent((id: string) => {
    if (!acceptsArrivalsRef.current) return;

    if (arrivalTimerRef.current !== null) {
      clearTimeout(arrivalTimerRef.current);
    }
    setArrivingIds((current) => new Set(current).add(id));
    arrivalTimerRef.current = setTimeout(() => {
      setArrivingIds(new Set());
      arrivalTimerRef.current = null;
    }, 1000);
  });

  useLayoutEffect(() => {
    acceptsArrivalsRef.current = true;

    return () => {
      acceptsArrivalsRef.current = false;
      if (arrivalTimerRef.current !== null) {
        clearTimeout(arrivalTimerRef.current);
      }
    };
  }, []);

  const metrics = useMemo<DashboardMetrics>(
    () => ({
      rowHeight: Math.max(1, rowHeight),
      columnGap: Math.max(0, columnGap),
      rowGap: Math.max(0, rowGap),
    }),
    [columnGap, rowGap, rowHeight],
  );
  const selection = useMemo<DashboardSelectionContextValue>(
    () => ({
      selectionMode,
      selectedKeys: selectedKeySet,
      register,
      select,
    }),
    [register, select, selectedKeySet, selectionMode],
  );
  const editing = useMemo<DashboardEditingContextValue>(
    () => ({
      isEditing,
      movingId,
      arrivingIds,
      markArriving,
      startMoving,
      stopMoving,
    }),
    [arrivingIds, isEditing, markArriving, movingId, startMoving, stopMoving],
  );
  const authoring = useMemo<DashboardAuthoringContextValue>(
    () => ({ addItems, onAddItem }),
    [addItems, onAddItem],
  );
  const rootTree = useMemo<DashboardTreeContextValue>(
    () => ({
      containerDepth: 0,
      parentKind: 'root',
      parentId: null,
      layoutParentId: null,
      parentColumns: 12,
      parentRows: 1,
      ancestorIds: [],
      parentStackUsed: 0,
    }),
    [],
  );
  // `otherProps` rather than `props`: `gap` is a container style prop as well as
  // a Dashboard prop, and extracting it would write the in-container gap onto the
  // root grid, overriding the fixed `2x` top-level channel.
  const extractedStyles = extractStyles(otherProps, CONTAINER_STYLES);
  const styles: Styles = { ...extractedStyles, ...explicitStyles };
  const baseProps = filterBaseProps(otherProps, {
    eventProps: true,
    labelable: true,
  });

  return (
    <DashboardMetricsContext.Provider value={metrics}>
      <DashboardSelectionContext.Provider value={selection}>
        <DashboardEditingContext.Provider value={editing}>
          <DashboardAuthoringContext.Provider value={authoring}>
            <DashboardTreeContext.Provider value={rootTree}>
              <DashboardElement
                {...baseProps}
                ref={ref}
                styles={styles}
                style={style}
                data-editing={isEditing || undefined}
                data-dragging={movingId !== null || undefined}
                data-dashboard-root=""
                data-dashboard-drop-target=""
                data-dashboard-parent-id=""
                data-dashboard-container-kind="root"
                data-dashboard-columns={12}
                data-dashboard-rows={Math.max(1, Children.count(children))}
                data-dashboard-depth={0}
                data-dashboard-ancestor-ids="[]"
              >
                {children}
                {isEditing ? (
                  <DashboardRootAddControl row={Children.count(children)} />
                ) : null}
              </DashboardElement>
            </DashboardTreeContext.Provider>
          </DashboardAuthoringContext.Provider>
        </DashboardEditingContext.Provider>
      </DashboardSelectionContext.Provider>
    </DashboardMetricsContext.Provider>
  );
});

export const Dashboard = Object.assign(DashboardRoot, {
  HorizontalStack: DashboardHorizontalStack,
  VerticalStack: DashboardVerticalStack,
  Grid: DashboardGrid,
  Tabs: DashboardTabs,
  Tab: DashboardTab,
  Widget: DashboardWidget,
});

export {
  DashboardGrid,
  DashboardHorizontalStack,
  DashboardVerticalStack,
} from './DashboardContainer';
export { DashboardTab, DashboardTabs } from './DashboardTabs';
export { DashboardWidget } from './DashboardWidget';

export type {
  CubeDashboardContainerProps,
  CubeDashboardProps,
  CubeDashboardTabProps,
  CubeDashboardTabsProps,
  CubeDashboardWidgetProps,
  DashboardAddItemDefinition,
  DashboardAddItemInfo,
  DashboardAddItemKind,
  DashboardContainerKind,
  DashboardNodeAction,
  DashboardParentKind,
  DashboardPlacement,
  DashboardPlacementChangeInfo,
  DashboardPlacementChangeInput,
  DashboardPlacementChangeItem,
  DashboardPlacementChangePhase,
  DashboardPlacementChangeReason,
  DashboardPlacementProps,
  DashboardSelectionMode,
} from './types';
